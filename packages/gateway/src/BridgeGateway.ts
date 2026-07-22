import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  BridgeMessage,
  CapabilityPolicy,
  CapabilityManifest,
  JsonObject,
  ManifestSignature,
  ToolDescriptor,
} from '@mobigent/core';
import { canonicalJson, toolName, validateCapabilityManifest } from '@mobigent/core';
import type { Logger } from './logger.js';
import { createConsoleLogger, createNoopLogger, buildLogContext } from './logger.js';

type PendingCall = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
};

type IdempotencyRecord = {
  inputHash: string;
  createdAt: number;
  lastUsedAt: number;
  promise?: Promise<unknown>;
  result?: unknown;
  settled: boolean;
};

export type ToolCallOptions = {
  agentId?: string;
  idempotencyKey?: string;
  timeoutMs?: number;
  requestId?: string;
};

export type AgentProfile = {
  description?: string;
  allowedTools?: string[];
  deniedTools?: string[];
  readOnly?: boolean;
  maxRisk?: 'low' | 'medium' | 'high';
};

export type AuditEventType =
  | 'gateway.started'
  | 'gateway.stopped'
  | 'session.connected'
  | 'session.disconnected'
  | 'app.authenticated'
  | 'app.rejected'
  | 'manifest.registered'
  | 'app.event'
  | 'message.malformed'
  | 'tool.call.started'
  | 'manifest.rejected'
  | 'tool.call.deduplicated'
  | 'tool.call.succeeded'
  | 'tool.call.failed'
  | 'tool.call.denied'
  | 'tool.call.timed_out';

export type AuditEvent = {
  id: string;
  at: string;
  type: AuditEventType;
  severity: 'info' | 'warn' | 'error';
  message: string;
  sessionId?: string;
  app?: {
    id: string;
    name: string;
  };
  tool?: string;
  agentId?: string;
  durationMs?: number;
  details?: JsonObject;
};

export type GatewayStatus = {
  appSessions: number;
  authenticatedAppSessions: number;
  appsWithManifests: number;
  tools: number;
  auditEvents: number;
  idempotencyRecords: number;
  rateLimitBuckets: number;
  manifestSigningRequired: boolean;
  appAllowlistEnabled: boolean;
  agentProfilesConfigured: boolean;
};

type ToolCallMetric = 'started' | 'succeeded' | 'failed' | 'denied' | 'timedOut' | 'deduplicated';
type ToolCallMetricCounts = Record<ToolCallMetric, number>;

export type GatewayMetrics = {
  status: GatewayStatus;
  auditEvents: Record<AuditEventType, number>;
  toolCalls: ToolCallMetricCounts;
  byTool: Record<string, ToolCallMetricCounts>;
  byAgent: Record<string, ToolCallMetricCounts>;
};

type AppSession = {
  id: string;
  socket: WebSocket;
  authenticated: boolean;
  connectedAt: string;
  lastSeenAt: string;
  protocolVersion?: number;
  manifest?: CapabilityManifest;
  manifestAcceptedAt?: string;
  manifestSignature?: ManifestSignature;
};

export type GatewayAppSession = {
  sessionId: string;
  connectedAt: string;
  lastSeenAt: string;
  ageMs: number;
  idleMs: number;
  authenticated: boolean;
  app?: {
    id: string;
    name: string;
    sdk: CapabilityManifest['sdk'];
    version: string;
    protocolVersion: number;
    protocolCompatible: boolean;
  };
  capabilities: {
    actions: number;
    resources: number;
    components: number;
    tools: number;
  };
  manifest?: {
    acceptedAt: string;
    signed: boolean;
    keyId?: string;
  };
};

export type GatewayAgentVisibility = {
  agentId: string;
  profileConfigured: boolean;
  profile?: AgentProfile;
  visibleTools: number;
  hiddenTools: number;
  visibleToolNames: string[];
  hiddenToolNames: string[];
};

const currentProtocolVersion = 1;
const supportedProtocolVersions = [1];

export type BridgeGatewayOptions = {
  port?: number;
  authToken?: string;
  requestTimeoutMs?: number;
  idempotencyRecordTtlMs?: number;
  cleanupIntervalMs?: number;
  auditLogLimit?: number;
  auditLogPath?: string;
  auditRedactKeys?: string[];
  manifestSigningSecret?: string;
  allowedAppIds?: string[];
  agentProfiles?: Record<string, AgentProfile>;
  /** Structured logger for gateway lifecycle and request events. */
  logger?: Logger;
};

const defaultAuditRedactKeys = [
  'access_token',
  'api_key',
  'authorization',
  'authToken',
  'password',
  'refresh_token',
  'secret',
  'token',
];

function emptyToolCallMetricCounts(): ToolCallMetricCounts {
  return {
    started: 0,
    succeeded: 0,
    failed: 0,
    denied: 0,
    timedOut: 0,
    deduplicated: 0,
  };
}

function isSupportedProtocolVersion(protocolVersion: number) {
  return Number.isInteger(protocolVersion) && supportedProtocolVersions.includes(protocolVersion);
}

function cloneMetricBuckets(buckets: Record<string, ToolCallMetricCounts>) {
  return Object.fromEntries(
    Object.entries(buckets).map(([key, value]) => [
      key,
      {
        ...value,
      },
    ]),
  );
}

function toolCallMetric(type: AuditEventType): ToolCallMetric | undefined {
  switch (type) {
    case 'tool.call.started':
      return 'started';
    case 'tool.call.succeeded':
      return 'succeeded';
    case 'tool.call.failed':
      return 'failed';
    case 'tool.call.denied':
      return 'denied';
    case 'tool.call.timed_out':
      return 'timedOut';
    case 'tool.call.deduplicated':
      return 'deduplicated';
    default:
      return undefined;
  }
}

export class BridgeGateway {
  private events = new EventEmitter();
  private appServer?: WebSocketServer;
  private sessions = new Map<string, AppSession>();
  private pending = new Map<string, PendingCall>();
  private idempotencyRecords = new Map<string, IdempotencyRecord>();
  private rateLimitBuckets = new Map<string, number[]>();
  private auditLog: AuditEvent[] = [];
  private readonly metrics: Omit<GatewayMetrics, 'status'> = {
    auditEvents: {
      'gateway.started': 0,
      'gateway.stopped': 0,
      'session.connected': 0,
      'session.disconnected': 0,
      'app.authenticated': 0,
      'app.rejected': 0,
      'manifest.registered': 0,
      'app.event': 0,
      'message.malformed': 0,
      'tool.call.started': 0,
      'manifest.rejected': 0,
      'tool.call.deduplicated': 0,
      'tool.call.succeeded': 0,
      'tool.call.failed': 0,
      'tool.call.denied': 0,
      'tool.call.timed_out': 0,
    },
    toolCalls: emptyToolCallMetricCounts(),
    byTool: {},
    byAgent: {},
  };
  private readonly port: number;
  private readonly authToken?: string;
  private readonly requestTimeoutMs: number;
  private readonly idempotencyRecordTtlMs: number;
  private readonly cleanupIntervalMs: number;
  private readonly auditLogLimit: number;
  private readonly auditLogPath?: string;
  private readonly auditRedactKeys: Set<string>;
  private readonly manifestSigningSecret?: string;
  private readonly allowedAppIds: Set<string>;
  private readonly agentProfiles: Map<string, AgentProfile>;
  private readonly logger: Logger;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: BridgeGatewayOptions | number = 8787) {
    if (typeof options === 'number') {
      this.port = options;
      this.requestTimeoutMs = 15_000;
      this.idempotencyRecordTtlMs = 5 * 60_000;
      this.cleanupIntervalMs = 60_000;
      this.auditLogLimit = 500;
      this.auditRedactKeys = new Set(defaultAuditRedactKeys.map((key) => key.toLowerCase()));
      this.allowedAppIds = new Set();
      this.agentProfiles = new Map();
      this.logger = createConsoleLogger('info');
      return;
    }

    this.port = options.port ?? 8787;
    this.authToken = options.authToken;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
    this.idempotencyRecordTtlMs = options.idempotencyRecordTtlMs ?? 5 * 60_000;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000;
    this.auditLogLimit = options.auditLogLimit ?? 500;
    this.auditLogPath = options.auditLogPath;
    this.auditRedactKeys = new Set(
      [...defaultAuditRedactKeys, ...(options.auditRedactKeys ?? [])].map((key) =>
        key.toLowerCase(),
      ),
    );
    this.manifestSigningSecret = options.manifestSigningSecret;
    this.allowedAppIds = new Set(options.allowedAppIds ?? []);
    this.agentProfiles = new Map(Object.entries(options.agentProfiles ?? {}));
    this.logger = options.logger ?? createConsoleLogger('info');
  }

  start() {
    this.appServer = new WebSocketServer({ port: this.port });
    this.appServer.on('connection', (socket) => this.handleConnection(socket));
    this.appServer.on('error', (err) => {
      this.logger.error('WebSocket server error', {
        eventType: 'gateway.error',
        errorCode: 'WS_SERVER_ERROR',
        context: { message: err.message },
      });
    });
    this.startCleanupTimer();
    this.logger.info('Gateway listening for mobile apps', {
      eventType: 'gateway.started',
      context: { port: this.port },
    });
    this.emitAudit({
      type: 'gateway.started',
      severity: 'info',
      message: `Gateway listening for mobile apps on port ${this.port}.`,
      details: { port: this.port },
    });
  }

  stop() {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Gateway stopped.'));
    }
    this.pending.clear();
    this.idempotencyRecords.clear();
    for (const session of this.sessions.values()) {
      session.socket.close();
    }
    this.sessions.clear();
    this.stopCleanupTimer();
    this.appServer?.close();
    this.emitToolsChanged();
    this.logger.info('Gateway stopped', { eventType: 'gateway.stopped' });
    this.emitAudit({
      type: 'gateway.stopped',
      severity: 'info',
      message: 'Gateway stopped.',
    });
  }

  onToolsChanged(listener: () => void) {
    this.events.on('toolsChanged', listener);

    return () => {
      this.events.off('toolsChanged', listener);
    };
  }

  onAudit(listener: (event: AuditEvent) => void) {
    this.events.on('audit', listener);

    return () => {
      this.events.off('audit', listener);
    };
  }

  getAuditLog(limit = this.auditLogLimit) {
    return this.auditLog.slice(-limit);
  }

  getStatus() {
    this.cleanupOperationalState();
    const apps = this.listApps();
    return {
      appSessions: apps.length,
      authenticatedAppSessions: apps.filter((app) => app.authenticated).length,
      appsWithManifests: apps.filter((app) => Boolean(app.manifest)).length,
      tools: this.listTools().length,
      auditEvents: this.auditLog.length,
      idempotencyRecords: this.idempotencyRecords.size,
      rateLimitBuckets: this.rateLimitBuckets.size,
      manifestSigningRequired: Boolean(this.manifestSigningSecret),
      appAllowlistEnabled: this.allowedAppIds.size > 0,
      agentProfilesConfigured: this.agentProfiles.size > 0,
    };
  }

  getMetrics(): GatewayMetrics {
    return {
      status: this.getStatus(),
      auditEvents: { ...this.metrics.auditEvents },
      toolCalls: { ...this.metrics.toolCalls },
      byTool: cloneMetricBuckets(this.metrics.byTool),
      byAgent: cloneMetricBuckets(this.metrics.byAgent),
    };
  }

  listApps(): GatewayAppSession[] {
    return [...this.sessions.values()].map((session) => {
      const manifest = session.manifest;
      const actions = manifest?.actions.length ?? 0;
      const resources = manifest?.resources.length ?? 0;
      const components = manifest?.components.length ?? 0;

      return {
        sessionId: session.id,
        connectedAt: session.connectedAt,
        lastSeenAt: session.lastSeenAt,
        ageMs: Math.max(0, Date.now() - Date.parse(session.connectedAt)),
        idleMs: Math.max(0, Date.now() - Date.parse(session.lastSeenAt)),
        authenticated: session.authenticated,
        app: manifest
          ? {
              id: manifest.appId,
              name: manifest.appName,
              sdk: manifest.sdk,
              version: manifest.version,
              protocolVersion:
                session.protocolVersion ?? manifest.protocolVersion ?? currentProtocolVersion,
              protocolCompatible: isSupportedProtocolVersion(
                session.protocolVersion ?? manifest.protocolVersion ?? currentProtocolVersion,
              ),
            }
          : undefined,
        capabilities: {
          actions,
          resources,
          components,
          tools: actions + resources + components,
        },
        manifest:
          manifest && session.manifestAcceptedAt
            ? {
                acceptedAt: session.manifestAcceptedAt,
                signed: Boolean(session.manifestSignature),
                keyId: session.manifestSignature?.keyId,
              }
            : undefined,
      };
    });
  }

  listTools(): ToolDescriptor[] {
    const tools: ToolDescriptor[] = [];

    for (const session of this.sessions.values()) {
      if (!session.manifest) {
        continue;
      }

      for (const action of session.manifest.actions) {
        tools.push({
          name: toolName(session.manifest.appId, action.name),
          description: `${session.manifest.appName}: ${action.description}`,
          inputSchema: action.inputSchema,
          outputSchema: action.outputSchema,
          readOnly: action.policy?.readOnly ?? false,
          risk: action.confirmation?.risk ?? 'medium',
          app: {
            id: session.manifest.appId,
            name: session.manifest.appName,
          },
        });
      }

      for (const resource of session.manifest.resources) {
        tools.push({
          name: toolName(session.manifest.appId, `get_${resource.name}`),
          description: `${session.manifest.appName}: Read ${resource.description}`,
          inputSchema: {
            type: 'object',
            properties: {},
          },
          outputSchema: resource.outputSchema,
          readOnly: true,
          risk: 'low',
          app: {
            id: session.manifest.appId,
            name: session.manifest.appName,
          },
        });
      }

      for (const component of session.manifest.components ?? []) {
        tools.push({
          name: toolName(session.manifest.appId, `show_${component.name}`),
          description: `${session.manifest.appName}: Show ${component.description}`,
          inputSchema: component.propsSchema ?? {
            type: 'object',
            properties: {},
          },
          readOnly: false,
          risk: 'low',
          app: {
            id: session.manifest.appId,
            name: session.manifest.appName,
          },
        });
      }
    }

    return tools;
  }

  listToolsForAgent(agentId?: string): ToolDescriptor[] {
    return this.listTools().filter((tool) => this.isToolVisibleToAgent(tool.name, agentId));
  }

  listAgentVisibility(agentIds?: string[]): GatewayAgentVisibility[] {
    const resolvedAgentIds =
      agentIds && agentIds.length > 0
        ? agentIds
        : this.agentProfiles.size > 0
          ? [...this.agentProfiles.keys()]
          : ['anonymous'];
    const tools = this.listTools();

    return resolvedAgentIds.map((agentId) => {
      const effectiveAgentId = agentId === 'anonymous' ? undefined : agentId;
      const visibleToolNames = tools
        .filter((tool) => this.isToolVisibleToAgent(tool.name, effectiveAgentId))
        .map((tool) => tool.name);
      const visible = new Set(visibleToolNames);
      const hiddenToolNames = tools
        .filter((tool) => !visible.has(tool.name))
        .map((tool) => tool.name);
      const profile = this.agentProfiles.get(agentId);

      return {
        agentId,
        profileConfigured: Boolean(profile),
        ...(profile ? { profile } : {}),
        visibleTools: visibleToolNames.length,
        hiddenTools: hiddenToolNames.length,
        visibleToolNames,
        hiddenToolNames,
      };
    });
  }

  async callTool(name: string, input: JsonObject, options: ToolCallOptions = {}) {
    const route = this.resolveTool(name);
    if (!route) {
      this.emitAudit({
        type: 'tool.call.failed',
        severity: 'warn',
        message: `No connected app exposes tool: ${name}`,
        tool: name,
        agentId: options.agentId,
      });
      throw new Error(`No connected app exposes tool: ${name}`);
    }

    try {
      this.assertAgentCanUseTool(name, route.policy, options.agentId);
    } catch (error) {
      this.emitAudit({
        type: 'tool.call.denied',
        severity: 'warn',
        message: error instanceof Error ? error.message : String(error),
        sessionId: route.session.id,
        app: this.sessionApp(route.session),
        tool: name,
        agentId: options.agentId,
      });
      throw error;
    }

    const idempotency = options.idempotencyKey
      ? this.prepareIdempotentCall(name, input, options, route.session)
      : undefined;
    if (idempotency?.reused) {
      return idempotency.promise;
    }

    try {
      this.assertRateLimitAllowsCall(name, route.policy, options.agentId);
    } catch (error) {
      // Keep the idempotency record so retrying does not execute the call twice.
      this.emitAudit({
        type: 'tool.call.denied',
        severity: 'warn',
        message: error instanceof Error ? error.message : String(error),
        sessionId: route.session.id,
        app: this.sessionApp(route.session),
        tool: name,
        agentId: options.agentId,
      });
      throw error;
    }

    const id = randomUUID();
    const startedAt = Date.now();
    const message: BridgeMessage =
      route.type === 'action'
        ? {
            type: 'call_action',
            id,
            name: route.capabilityName,
            input,
          }
        : route.type === 'resource'
          ? {
              type: 'read_resource',
              id,
              name: route.capabilityName,
            }
          : {
              type: 'focus_component',
              id,
              name: route.capabilityName,
              props: input,
            };

    this.emitAudit({
      type: 'tool.call.started',
      severity: 'info',
      message: `Calling ${name}.`,
      sessionId: route.session.id,
      app: this.sessionApp(route.session),
      tool: name,
      agentId: options.agentId,
      details: {
        requestId: id,
        externalRequestId: options.requestId,
        idempotencyKey: options.idempotencyKey,
        capabilityType: route.type,
      },
    });

    try {
      const promise = this.sendRequest(route.session, message, id, options.timeoutMs, {
        tool: name,
        agentId: options.agentId,
      });
      if (idempotency?.record) {
        idempotency.record.promise = promise;
      }
      const result = await promise;
      if (idempotency?.record) {
        idempotency.record.result = result;
        idempotency.record.settled = true;
        idempotency.record.lastUsedAt = Date.now();
        idempotency.record.promise = undefined;
      }
      this.emitAudit({
        type: 'tool.call.succeeded',
        severity: 'info',
        message: `Tool call succeeded: ${name}.`,
        sessionId: route.session.id,
        app: this.sessionApp(route.session),
        tool: name,
        agentId: options.agentId,
        durationMs: Date.now() - startedAt,
        details: {
          requestId: id,
          externalRequestId: options.requestId,
          idempotencyKey: options.idempotencyKey,
        },
      });
      return result;
    } catch (error) {
      if (idempotency?.key) {
        this.idempotencyRecords.delete(idempotency.key);
      }
      const messageText = error instanceof Error ? error.message : String(error);
      this.emitAudit({
        type: messageText.startsWith('Timed out') ? 'tool.call.timed_out' : 'tool.call.failed',
        severity: 'error',
        message: messageText,
        sessionId: route.session.id,
        app: this.sessionApp(route.session),
        tool: name,
        agentId: options.agentId,
        durationMs: Date.now() - startedAt,
        details: {
          requestId: id,
          externalRequestId: options.requestId,
          idempotencyKey: options.idempotencyKey,
        },
      });
      throw error;
    }
  }

  assertToolAgentAllowed(name: string, agentId?: string) {
    const route = this.resolveTool(name);
    if (!route) {
      throw new Error(`No connected app exposes tool: ${name}`);
    }

    this.assertAgentCanUseTool(name, route.policy, agentId);
  }

  isToolVisibleToAgent(name: string, agentId?: string) {
    const route = this.resolveTool(name);
    if (!route) {
      return false;
    }

    try {
      this.assertAgentCanUseTool(name, route.policy, agentId);
      return true;
    } catch {
      return false;
    }
  }

  private prepareIdempotentCall(
    name: string,
    input: JsonObject,
    options: ToolCallOptions,
    session: AppSession,
  ):
    | {
        key: string;
        record: IdempotencyRecord;
        reused: false;
      }
    | {
        promise: Promise<unknown>;
        reused: true;
      } {
    const key = this.idempotencyRecordKey(name, options);
    const inputHash = canonicalJson(input);
    const existing = this.idempotencyRecords.get(key);

    if (existing) {
      if (existing.inputHash !== inputHash) {
        throw new Error(
          `Idempotency key "${options.idempotencyKey}" was already used with different input.`,
        );
      }

      // Stale unsettled record with no promise means a previous attempt
      // was aborted before the call reached the app (e.g., rate-limited).
      // Overwrite it so the retry can proceed normally.
      if (!existing.settled && !existing.promise) {
        const freshRecord: IdempotencyRecord = {
          inputHash,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          settled: false,
        };
        this.idempotencyRecords.set(key, freshRecord);
        return { key, record: freshRecord, reused: false };
      }

      existing.lastUsedAt = Date.now();
      this.emitAudit({
        type: 'tool.call.deduplicated',
        severity: 'info',
        message: `Reusing idempotent result for ${name}.`,
        sessionId: session.id,
        app: this.sessionApp(session),
        tool: name,
        agentId: options.agentId,
        details: {
          externalRequestId: options.requestId,
          idempotencyKey: options.idempotencyKey,
        },
      });

      return {
        promise: existing.settled
          ? Promise.resolve(existing.result)
          : (existing.promise ?? Promise.resolve(existing.result)),
        reused: true,
      };
    }

    const record: IdempotencyRecord = {
      inputHash,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      settled: false,
    };
    this.idempotencyRecords.set(key, record);

    return {
      key,
      record,
      reused: false,
    };
  }

  private idempotencyRecordKey(name: string, options: ToolCallOptions) {
    return `${options.agentId ?? 'anonymous'}:${name}:${options.idempotencyKey}`;
  }

  private handleConnection(socket: WebSocket) {
    const session: AppSession = {
      id: randomUUID(),
      socket,
      authenticated: !this.authToken,
      connectedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    this.logger.info(`App session connected: ${session.id}`, {
      sessionId: session.id,
      eventType: 'session.connected',
    });
    this.emitAudit({
      type: 'session.connected',
      severity: 'info',
      message: `Mobile app session connected: ${session.id}.`,
      sessionId: session.id,
    });

    socket.on('message', (raw) => {
      try {
        session.lastSeenAt = new Date().toISOString();
        this.handleAppMessage(session, JSON.parse(raw.toString()) as BridgeMessage);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Malformed app message from ${session.id}`, {
          sessionId: session.id,
          eventType: 'message.malformed',
          errorCode: 'MALFORMED_MESSAGE',
        });
        this.emitAudit({
          type: 'message.malformed',
          severity: 'warn',
          message: `Ignoring malformed app message: ${message}`,
          sessionId: session.id,
        });
      }
    });

    socket.on('close', () => {
      this.sessions.delete(session.id);
      this.logger.info(`App session disconnected: ${session.id}`, {
        sessionId: session.id,
        eventType: 'session.disconnected',
        appId: session.manifest?.appId,
      });
      this.emitAudit({
        type: 'session.disconnected',
        severity: 'info',
        message: `Mobile app session disconnected: ${session.id}.`,
        sessionId: session.id,
        app: this.sessionApp(session),
      });
      this.emitToolsChanged();
    });

    socket.on('error', (err) => {
      this.logger.error('WebSocket session error', {
        sessionId: session.id,
        eventType: 'session.error',
        errorCode: 'WS_SESSION_ERROR',
        context: { message: err.message },
      });
      this.sessions.delete(session.id);
      this.emitToolsChanged();
    });
  }

  private handleAppMessage(session: AppSession, message: BridgeMessage) {
    if (message.type === 'hello') {
      const protocolVersion = message.protocolVersion ?? currentProtocolVersion;
      if (!isSupportedProtocolVersion(protocolVersion)) {
        this.logger.warn(
          `Rejected app session with unsupported protocol version: ${protocolVersion}`,
          {
            sessionId: session.id,
            eventType: 'app.rejected',
            context: { protocolVersion, supportedProtocolVersions },
          },
        );
        session.authenticated = false;
        this.emitAudit({
          type: 'app.rejected',
          severity: 'warn',
          message: `Rejected app session with unsupported protocol version: ${protocolVersion}.`,
          sessionId: session.id,
          app: {
            id: message.appId,
            name: message.appName,
          },
          details: {
            reason: 'unsupported_protocol_version',
            protocolVersion,
            supportedProtocolVersions,
          },
        });
        session.socket.close(1002, 'Unsupported Mobigent protocol version.');
        return;
      }

      if (this.allowedAppIds.size > 0 && !this.allowedAppIds.has(message.appId)) {
        this.logger.warn(`Rejected app session with disallowed app id: ${message.appId}`, {
          sessionId: session.id,
          eventType: 'app.rejected',
          context: { appId: message.appId },
        });
        session.authenticated = false;
        this.emitAudit({
          type: 'app.rejected',
          severity: 'warn',
          message: `Rejected app session with disallowed app id: ${message.appId}.`,
          sessionId: session.id,
          app: {
            id: message.appId,
            name: message.appName,
          },
          details: {
            reason: 'app_id_not_allowed',
          },
        });
        session.socket.close(1008, 'Mobigent app id is not allowed.');
        return;
      }

      if (this.authToken) {
        const expected = Buffer.from(this.authToken);
        const actual = Buffer.from(message.authToken ?? '');
        const authFailed = expected.length !== actual.length || !timingSafeEqual(expected, actual);
        if (authFailed) {
          this.logger.warn(`Rejected unauthenticated app session: ${session.id}`, {
            sessionId: session.id,
            eventType: 'app.rejected',
          });
          this.emitAudit({
            type: 'app.rejected',
            severity: 'warn',
            message: `Rejected unauthenticated app session: ${session.id}.`,
            sessionId: session.id,
            app: {
              id: message.appId,
              name: message.appName,
            },
          });
          session.socket.close(1008, 'Invalid Mobigent auth token.');
          return;
        }
      }

      session.authenticated = true;
      session.protocolVersion = protocolVersion;
      this.logger.info(`App hello: ${message.appName} (${message.appId}) via ${message.sdk}`, {
        sessionId: session.id,
        eventType: 'app.authenticated',
        context: { appId: message.appId, appName: message.appName, sdk: message.sdk },
      });
      try {
        session.socket.send(
          JSON.stringify({
            type: 'ready',
            protocolVersion,
            supportedProtocolVersions,
          } satisfies BridgeMessage),
        );
      } catch (sendErr) {
        this.logger.error('Failed to send ready message to app session', {
          sessionId: session.id,
          eventType: 'gateway.error',
          errorCode: 'WS_SEND_ERROR',
          context: { error: sendErr instanceof Error ? sendErr.message : String(sendErr) },
        });
      }
      this.emitAudit({
        type: 'app.authenticated',
        severity: 'info',
        message: `App authenticated: ${message.appName}.`,
        sessionId: session.id,
        app: {
          id: message.appId,
          name: message.appName,
        },
        details: { sdk: message.sdk, version: message.version, protocolVersion },
      });
      return;
    }

    if (!session.authenticated) {
      this.logger.warn(`Ignoring message from unauthenticated app session: ${session.id}`, {
        sessionId: session.id,
        eventType: 'app.rejected',
      });
      return;
    }

    if (message.type === 'manifest') {
      const manifestValidation = validateCapabilityManifest(message.manifest);
      if (!manifestValidation.ok) {
        this.logger.warn(`Rejected malformed manifest from ${session.id}`, {
          sessionId: session.id,
          eventType: 'manifest.rejected',
        });
        this.emitAudit({
          type: 'manifest.rejected',
          severity: 'warn',
          message: `Rejected malformed manifest from ${session.id}.`,
          sessionId: session.id,
          app: this.manifestAuditApp(message.manifest),
          details: {
            reason: 'invalid_manifest',
            errors: manifestValidation.errors,
          },
        });
        return;
      }

      const manifestProtocolVersion =
        message.manifest.protocolVersion ?? session.protocolVersion ?? currentProtocolVersion;
      if (!isSupportedProtocolVersion(manifestProtocolVersion)) {
        this.logger.warn(`Rejected manifest with unsupported protocol version from ${session.id}`, {
          sessionId: session.id,
          eventType: 'manifest.rejected',
          context: { protocolVersion: manifestProtocolVersion, supportedProtocolVersions },
        });
        this.emitAudit({
          type: 'manifest.rejected',
          severity: 'warn',
          message: `Rejected manifest with unsupported protocol version from ${session.id}.`,
          sessionId: session.id,
          app: {
            id: message.manifest.appId,
            name: message.manifest.appName,
          },
          details: {
            reason: 'unsupported_protocol_version',
            protocolVersion: manifestProtocolVersion,
            supportedProtocolVersions,
          },
        });
        return;
      }

      if (!this.verifyManifestSignature(message.manifest, message.signature)) {
        this.logger.warn(`Rejected unsigned or invalid manifest from ${session.id}`, {
          sessionId: session.id,
          eventType: 'manifest.rejected',
        });
        this.emitAudit({
          type: 'manifest.rejected',
          severity: 'warn',
          message: `Rejected unsigned or invalid manifest from ${session.id}.`,
          sessionId: session.id,
          app: {
            id: message.manifest.appId,
            name: message.manifest.appName,
          },
        });
        return;
      }

      const duplicateToolName = this.findDuplicateToolName(session, message.manifest);
      if (duplicateToolName) {
        this.logger.warn(
          `Rejected manifest from ${session.id} because ${duplicateToolName} is already exposed`,
          {
            sessionId: session.id,
            eventType: 'manifest.rejected',
            context: { duplicateToolName },
          },
        );
        this.emitAudit({
          type: 'manifest.rejected',
          severity: 'warn',
          message: `Rejected manifest with duplicate tool name: ${duplicateToolName}.`,
          sessionId: session.id,
          app: {
            id: message.manifest.appId,
            name: message.manifest.appName,
          },
          details: {
            reason: 'duplicate_tool_name',
            tool: duplicateToolName,
          },
        });
        return;
      }

      session.manifest = message.manifest;
      session.manifestAcceptedAt = new Date().toISOString();
      session.manifestSignature = message.signature;
      this.logger.info(
        `Manifest registered: ${message.manifest.appName} with ${message.manifest.actions.length} actions, ${message.manifest.resources.length} resources, and ${message.manifest.components?.length ?? 0} components`,
        {
          sessionId: session.id,
          eventType: 'manifest.registered',
          context: {
            actionCount: message.manifest.actions.length,
            resourceCount: message.manifest.resources.length,
            componentCount: message.manifest.components?.length ?? 0,
          },
        },
      );
      this.emitAudit({
        type: 'manifest.registered',
        severity: 'info',
        message: `Manifest registered: ${message.manifest.appName}.`,
        sessionId: session.id,
        app: this.sessionApp(session),
        details: {
          actionCount: message.manifest.actions.length,
          resourceCount: message.manifest.resources.length,
          componentCount: message.manifest.components?.length ?? 0,
        },
      });
      this.emitToolsChanged();
      return;
    }

    if (message.type === 'event') {
      this.logger.info(`App event: ${message.name}`, {
        sessionId: session.id,
        eventType: 'app.event',
        context: { name: message.name, payload: this.redactValue(message.payload) },
      });
      this.emitAudit({
        type: 'app.event',
        severity: 'info',
        message: `App event: ${message.name}.`,
        sessionId: session.id,
        app: this.sessionApp(session),
        details: {
          name: message.name,
          payload: message.payload,
          at: message.at,
        },
      });
      return;
    }

    if (message.type === 'ping') {
      try {
        session.socket.send(
          JSON.stringify({
            type: 'pong',
            id: message.id,
            at: new Date().toISOString(),
          } satisfies BridgeMessage),
        );
      } catch (sendErr) {
        this.logger.error('Failed to send pong to app session', {
          sessionId: session.id,
          eventType: 'gateway.error',
          errorCode: 'WS_SEND_ERROR',
          context: { error: sendErr instanceof Error ? sendErr.message : String(sendErr) },
        });
      }
      return;
    }

    if (
      message.type === 'action_result' ||
      message.type === 'resource_result' ||
      message.type === 'component_result'
    ) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(message.id);

      if (message.ok) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(message.error));
      }
    }
  }

  private resolveTool(name: string):
    | {
        session: AppSession;
        type: 'action' | 'resource' | 'component';
        capabilityName: string;
        policy?: CapabilityPolicy;
      }
    | undefined {
    for (const session of this.sessions.values()) {
      if (!session.manifest) {
        continue;
      }

      for (const action of session.manifest.actions) {
        if (toolName(session.manifest.appId, action.name) === name) {
          return { session, type: 'action', capabilityName: action.name, policy: action.policy };
        }
      }

      for (const resource of session.manifest.resources) {
        const resourceToolName = toolName(session.manifest.appId, `get_${resource.name}`);
        if (resourceToolName === name) {
          return {
            session,
            type: 'resource',
            capabilityName: resource.name,
            policy: resource.policy,
          };
        }
      }

      for (const component of session.manifest.components ?? []) {
        const componentToolName = toolName(session.manifest.appId, `show_${component.name}`);
        if (componentToolName === name) {
          return {
            session,
            type: 'component',
            capabilityName: component.name,
            policy: component.policy,
          };
        }
      }
    }

    return undefined;
  }

  private findDuplicateToolName(session: AppSession, manifest: CapabilityManifest) {
    const proposed = new Set(this.manifestToolNames(manifest));
    for (const existingSession of this.sessions.values()) {
      if (existingSession.id === session.id || !existingSession.manifest) {
        continue;
      }

      for (const existingName of this.manifestToolNames(existingSession.manifest)) {
        if (proposed.has(existingName)) {
          return existingName;
        }
      }
    }

    return undefined;
  }

  private manifestToolNames(manifest: CapabilityManifest) {
    return [
      ...manifest.actions.map((action) => toolName(manifest.appId, action.name)),
      ...manifest.resources.map((resource) => toolName(manifest.appId, `get_${resource.name}`)),
      ...(manifest.components ?? []).map((component) =>
        toolName(manifest.appId, `show_${component.name}`),
      ),
    ];
  }

  private sendRequest(
    session: AppSession,
    message: BridgeMessage,
    id: string,
    timeoutMs = this.requestTimeoutMs,
    _context?: {
      tool: string;
      agentId?: string;
    },
  ) {
    if (session.socket.readyState !== WebSocket.OPEN) {
      throw new Error('App session is not connected.');
    }

    let timeout: NodeJS.Timeout;
    const response = new Promise<unknown>((resolve, reject) => {
      timeout = setTimeout(() => {
        this.pending.delete(id);
        const error = new Error(`Timed out waiting for app response to ${id}.`);
        reject(error);
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timeout });
    });

    try {
      session.socket.send(JSON.stringify(message));
    } catch (sendErr) {
      clearTimeout(timeout!);
      this.pending.delete(id);
      this.logger.error('Failed to send message to app session', {
        sessionId: session.id,
        eventType: 'gateway.error',
        errorCode: 'WS_SEND_ERROR',
        context: { error: sendErr instanceof Error ? sendErr.message : String(sendErr) },
      });
      throw new Error(
        `Failed to send message to app session: ${sendErr instanceof Error ? sendErr.message : String(sendErr)}`,
      );
    }
    return response;
  }

  private assertPolicyAllowsCall(
    tool: string,
    policy: CapabilityPolicy | undefined,
    agentId?: string,
  ) {
    this.assertAgentCanUseTool(tool, policy, agentId);
    this.assertRateLimitAllowsCall(tool, policy, agentId);
  }

  private assertRateLimitAllowsCall(
    tool: string,
    policy: CapabilityPolicy | undefined,
    agentId?: string,
  ) {
    if (policy?.rateLimitPerMinute) {
      this.consumeRateLimit(tool, agentId ?? 'anonymous', policy.rateLimitPerMinute);
    }
  }

  private assertAllowedAgents(
    tool: string,
    policy: CapabilityPolicy | undefined,
    agentId?: string,
  ) {
    if (policy?.allowedAgents?.length && (!agentId || !policy.allowedAgents.includes(agentId))) {
      throw new Error(`Agent "${agentId ?? 'anonymous'}" is not allowed to call ${tool}.`);
    }
  }

  private assertAgentCanUseTool(
    tool: string,
    policy: CapabilityPolicy | undefined,
    agentId?: string,
  ) {
    this.assertAllowedAgents(tool, policy, agentId);
    this.assertAgentProfileAllowsTool(tool, agentId);
  }

  private assertAgentProfileAllowsTool(toolNameValue: string, agentId?: string) {
    const profile = this.agentProfileFor(agentId);
    if (!profile) {
      return;
    }

    if (profile.deniedTools?.some((pattern) => matchesToolPattern(toolNameValue, pattern))) {
      throw new Error(
        `Agent "${agentId ?? 'anonymous'}" profile denies access to ${toolNameValue}.`,
      );
    }

    if (
      profile.allowedTools?.length &&
      !profile.allowedTools.some((pattern) => matchesToolPattern(toolNameValue, pattern))
    ) {
      throw new Error(`Agent "${agentId ?? 'anonymous'}" profile does not allow ${toolNameValue}.`);
    }

    const descriptor = this.listTools().find((candidate) => candidate.name === toolNameValue);
    if (!descriptor) {
      return;
    }

    if (profile.readOnly && !descriptor.readOnly) {
      throw new Error(
        `Agent "${agentId ?? 'anonymous'}" profile is read-only and cannot call ${toolNameValue}.`,
      );
    }

    if (profile.maxRisk && riskRank(descriptor.risk) > riskRank(profile.maxRisk)) {
      throw new Error(
        `Agent "${agentId ?? 'anonymous'}" profile allows up to ${profile.maxRisk} risk, but ${toolNameValue} is ${descriptor.risk} risk.`,
      );
    }
  }

  private agentProfileFor(agentId?: string) {
    return this.agentProfiles.get(agentId ?? 'anonymous') ?? this.agentProfiles.get('*');
  }

  private consumeRateLimit(tool: string, agentId: string, limit: number) {
    const now = Date.now();
    const windowStart = now - 60_000;
    const key = `${agentId}:${tool}`;
    const calls = (this.rateLimitBuckets.get(key) ?? []).filter(
      (timestamp) => timestamp > windowStart,
    );

    if (calls.length >= limit) {
      this.rateLimitBuckets.set(key, calls);
      throw new Error(`Rate limit exceeded for ${tool}: ${limit} call(s) per minute.`);
    }

    calls.push(now);
    this.rateLimitBuckets.set(key, calls);
  }

  private startCleanupTimer() {
    if (this.cleanupIntervalMs <= 0 || this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => this.cleanupOperationalState(), this.cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  private stopCleanupTimer() {
    if (!this.cleanupTimer) {
      return;
    }

    clearInterval(this.cleanupTimer);
    this.cleanupTimer = undefined;
  }

  private cleanupOperationalState(now = Date.now()) {
    this.cleanupIdempotencyRecords(now);
    this.cleanupRateLimitBuckets(now);
  }

  private cleanupIdempotencyRecords(now: number) {
    if (this.idempotencyRecordTtlMs < 0) {
      return;
    }

    for (const [key, record] of this.idempotencyRecords) {
      if (record.settled && now - record.lastUsedAt >= this.idempotencyRecordTtlMs) {
        this.idempotencyRecords.delete(key);
      }
    }
  }

  private cleanupRateLimitBuckets(now: number) {
    const windowStart = now - 60_000;
    for (const [key, timestamps] of this.rateLimitBuckets) {
      const active = timestamps.filter((timestamp) => timestamp > windowStart);
      if (active.length === 0) {
        this.rateLimitBuckets.delete(key);
      } else if (active.length !== timestamps.length) {
        this.rateLimitBuckets.set(key, active);
      }
    }
  }

  private emitToolsChanged() {
    this.events.emit('toolsChanged');
  }

  private emitAudit(event: Omit<AuditEvent, 'id' | 'at'>) {
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      at: new Date().toISOString(),
      ...this.redactAuditEvent(event),
    };

    this.recordMetrics(auditEvent);
    this.auditLog.push(auditEvent);
    if (this.auditLog.length > this.auditLogLimit) {
      this.auditLog.splice(0, this.auditLog.length - this.auditLogLimit);
    }
    this.writeAuditEvent(auditEvent);
    this.events.emit('audit', auditEvent);
  }

  private recordMetrics(event: AuditEvent) {
    this.metrics.auditEvents[event.type] += 1;
    const metric = toolCallMetric(event.type);
    if (!metric) {
      return;
    }

    this.metrics.toolCalls[metric] += 1;
    if (event.tool) {
      this.metricBucket(this.metrics.byTool, event.tool)[metric] += 1;
    }
    this.metricBucket(this.metrics.byAgent, event.agentId ?? 'anonymous')[metric] += 1;
  }

  private metricBucket(buckets: GatewayMetrics['byTool'], key: string): ToolCallMetricCounts {
    buckets[key] ??= {
      ...emptyToolCallMetricCounts(),
    };
    return buckets[key];
  }

  private redactAuditEvent(event: Omit<AuditEvent, 'id' | 'at'>): Omit<AuditEvent, 'id' | 'at'> {
    return this.redactValue(event) as Omit<AuditEvent, 'id' | 'at'>;
  }

  private redactValue(value: unknown, key?: string): unknown {
    if (key && this.auditRedactKeys.has(key.toLowerCase())) {
      return '[REDACTED]';
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.redactValue(item));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as JsonObject).map(([childKey, childValue]) => [
          childKey,
          this.redactValue(childValue, childKey),
        ]),
      );
    }

    return value;
  }

  private verifyManifestSignature(manifest: CapabilityManifest, signature?: ManifestSignature) {
    if (!this.manifestSigningSecret) {
      return true;
    }

    if (!signature || signature.alg !== 'hmac-sha256') {
      return false;
    }

    const expected = createHmac('sha256', this.manifestSigningSecret)
      .update(canonicalJson(manifest))
      .digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(signature.signature, 'hex');

    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private writeAuditEvent(event: AuditEvent) {
    if (!this.auditLogPath) {
      return;
    }

    try {
      mkdirSync(dirname(this.auditLogPath), { recursive: true });
      appendFileSync(this.auditLogPath, `${JSON.stringify(event)}\n`, 'utf8');
    } catch (error) {
      this.logger.warn(
        `Failed to write Mobigent audit event to ${this.auditLogPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          eventType: 'gateway.error',
          errorCode: 'AUDIT_SINK_FAILURE',
          context: { auditPath: this.auditLogPath },
        },
      );
    }
  }

  private sessionApp(session: AppSession) {
    if (!session.manifest) {
      return undefined;
    }

    return {
      id: session.manifest.appId,
      name: session.manifest.appName,
    };
  }

  private manifestAuditApp(manifest: unknown) {
    if (
      manifest &&
      typeof manifest === 'object' &&
      !Array.isArray(manifest) &&
      typeof (manifest as { appId?: unknown }).appId === 'string' &&
      typeof (manifest as { appName?: unknown }).appName === 'string'
    ) {
      return {
        id: (manifest as { appId: string }).appId,
        name: (manifest as { appName: string }).appName,
      };
    }

    return undefined;
  }
}

function matchesToolPattern(tool: string, pattern: string) {
  if (pattern === '*' || pattern === tool) {
    return true;
  }

  if (pattern.endsWith('*')) {
    return tool.startsWith(pattern.slice(0, -1));
  }

  return false;
}

function riskRank(risk: 'low' | 'medium' | 'high') {
  switch (risk) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
  }
}
