import { z } from "zod";
import type {
  ActionDefinition,
  BridgeMessage,
  CapabilityManifest,
  ComponentDefinition,
  JsonObject,
  ManifestSignature,
  ResourceDefinition
} from "@mobigent/core";
import { validateJsonSchema } from "@mobigent/core";
import {
  createDefaultSocket,
  onClose,
  onError,
  onMessage,
  onceOpen,
  OPEN,
  type MobigentSocket,
  type MobigentSocketFactory
} from "./transport.js";
import type { ConfirmationController } from "./confirmation.js";

const mobigentProtocolVersion = 1;

type ActionHandler = (input: JsonObject) => Promise<unknown> | unknown;
type ResourceReader = () => Promise<unknown> | unknown;
type ComponentFocusHandler = (props: JsonObject) => Promise<unknown> | unknown;
type ConfirmationHandler = (request: {
  action: ActionDefinition;
  input: JsonObject;
}) => Promise<boolean> | boolean;
export type MobigentManifestSigner = (
  manifest: CapabilityManifest
) => Promise<ManifestSignature> | ManifestSignature;

export type MobigentConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export type MobigentReconnectOptions = {
  enabled?: boolean;
  maxAttempts?: number;
  delayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterRatio?: number;
};

export type MobigentEventQueueOptions = {
  enabled?: boolean;
  maxSize?: number;
};

export type MobigentHeartbeatOptions = {
  enabled?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
};

export type MobigentConnectionListener = (state: MobigentConnectionState) => void;

export type MobigentDiagnosticSeverity = "info" | "warn" | "error";

export type MobigentDiagnosticIssue = {
  severity: MobigentDiagnosticSeverity;
  code: string;
  message: string;
};

export type MobigentDiagnostics = {
  configured: boolean;
  appId?: string;
  appName?: string;
  gatewayUrl?: string;
  connectionState: MobigentConnectionState;
  connected: boolean;
  capabilityCounts: {
    actions: number;
    resources: number;
    components: number;
    total: number;
  };
  queuedEventCount: number;
  reconnectEnabled: boolean;
  heartbeatEnabled: boolean;
  lastError?: string;
  issues: MobigentDiagnosticIssue[];
};

export type MobigentDiagnosticsFormatOptions = {
  includeIssues?: boolean;
  includeGatewayUrl?: boolean;
};

type AgentBridgeOptions = {
  appId: string;
  appName: string;
  gatewayUrl: string;
  version?: string;
  authToken?: string;
  confirm?: ConfirmationHandler;
  confirmationController?: ConfirmationController;
  signManifest?: MobigentManifestSigner;
  createSocket?: MobigentSocketFactory;
  reconnect?: boolean | MobigentReconnectOptions;
  eventQueue?: boolean | MobigentEventQueueOptions;
  heartbeat?: boolean | MobigentHeartbeatOptions;
};

type RegisteredAction = ActionDefinition & {
  handler: ActionHandler;
};

type RegisteredResource = ResourceDefinition & {
  read: ResourceReader;
};

type RegisteredComponent = ComponentDefinition & {
  focus: ComponentFocusHandler;
};

const objectInputSchema = z.record(z.string(), z.unknown());
type EventMessage = Extract<BridgeMessage, { type: "event" }>;

export class Mobigent {
  private actions = new Map<string, RegisteredAction>();
  private resources = new Map<string, RegisteredResource>();
  private components = new Map<string, RegisteredComponent>();
  private socket?: MobigentSocket;
  private options?: AgentBridgeOptions;
  private connectionState: MobigentConnectionState = "idle";
  private connectionListeners = new Set<MobigentConnectionListener>();
  private manualDisconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private eventQueue: EventMessage[] = [];
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private heartbeatTimeout?: ReturnType<typeof setTimeout>;
  private pendingHeartbeatId?: string;
  private lastError?: string;

  configure(options: AgentBridgeOptions) {
    this.options = {
      version: "0.1.3",
      ...options
    };
    this.lastError = undefined;
  }

  registerAction(action: ActionDefinition & { handler: ActionHandler }) {
    this.assertCapabilityName(action.name);
    this.assertCapabilityAvailable("action", action.name);
    this.actions.set(action.name, action);
    void this.sendManifest();
  }

  unregisterAction(name: string) {
    const deleted = this.actions.delete(name);
    if (deleted) {
      void this.sendManifest();
    }
    return deleted;
  }

  registerResource(resource: ResourceDefinition & { read: ResourceReader }) {
    this.assertCapabilityName(resource.name);
    this.assertCapabilityAvailable("resource", resource.name);
    this.resources.set(resource.name, resource);
    void this.sendManifest();
  }

  unregisterResource(name: string) {
    const deleted = this.resources.delete(name);
    if (deleted) {
      void this.sendManifest();
    }
    return deleted;
  }

  registerComponent(component: ComponentDefinition & { focus: ComponentFocusHandler }) {
    this.assertCapabilityName(component.name);
    this.assertCapabilityAvailable("component", component.name);
    this.components.set(component.name, component);
    void this.sendManifest();
  }

  unregisterComponent(name: string) {
    const deleted = this.components.delete(name);
    if (deleted) {
      void this.sendManifest();
    }
    return deleted;
  }

  async connect() {
    if (!this.options) {
      throw new Error("Mobigent.configure must be called before connect.");
    }

    this.manualDisconnect = false;
    this.setConnectionState(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");
    this.socket = (this.options.createSocket ?? createDefaultSocket)(this.options.gatewayUrl);

    try {
      await onceOpen(this.socket);
    } catch (error) {
      this.recordError(error);
      if (!this.getReconnectOptions().enabled) {
        this.setConnectionState("error");
      }
      throw error;
    }

    this.reconnectAttempts = 0;
    this.setConnectionState("connected");

    onMessage(this.socket, (raw) => {
      try {
        void this.handleMessage(JSON.parse(raw) as BridgeMessage).catch((error) => this.recordError(error));
      } catch (error) {
        this.recordError(error);
      }
    });
    onClose(this.socket, () => this.handleSocketClose());
    onError(this.socket, (error) => {
      this.recordError(error);
      if (!this.getReconnectOptions().enabled) {
        this.setConnectionState("error");
      }
    });

    this.send({
      type: "hello",
      appId: this.options.appId,
      appName: this.options.appName,
      sdk: "react-native",
      version: this.options.version ?? "0.1.3",
      protocolVersion: mobigentProtocolVersion,
      authToken: this.options.authToken
    });
    void this.sendManifest();
    this.flushEventQueue();
    this.startHeartbeat();
  }

  disconnect() {
    this.manualDisconnect = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.socket?.close();
    this.socket = undefined;
    this.setConnectionState("disconnected");
  }

  emit(name: string, payload: JsonObject) {
    const message: EventMessage = {
      type: "event",
      name,
      payload,
      at: new Date().toISOString()
    };

    if (this.canSend()) {
      this.send(message);
      return true;
    }

    return this.queueEvent(message);
  }

  getManifest(): CapabilityManifest {
    if (!this.options) {
      throw new Error("Mobigent.configure must be called before getManifest.");
    }

    return {
      appId: this.options.appId,
      appName: this.options.appName,
      sdk: "react-native",
      version: this.options.version ?? "0.1.3",
      protocolVersion: mobigentProtocolVersion,
      actions: [...this.actions.values()].map(({ handler: _handler, ...action }) => action),
      resources: [...this.resources.values()].map(({ read: _read, ...resource }) => resource),
      components: [...this.components.values()].map(({ focus: _focus, ...component }) => component)
    };
  }

  getConnectionState() {
    return this.connectionState;
  }

  getQueuedEventCount() {
    return this.eventQueue.length;
  }

  getDiagnostics(): MobigentDiagnostics {
    const actionCount = this.actions.size;
    const resourceCount = this.resources.size;
    const componentCount = this.components.size;
    const totalCapabilityCount = actionCount + resourceCount + componentCount;
    const reconnectEnabled = this.getReconnectOptions().enabled;
    const heartbeatEnabled = this.getHeartbeatOptions().enabled;
    const issues: MobigentDiagnosticIssue[] = [];

    if (!this.options) {
      issues.push({
        severity: "error",
        code: "not_configured",
        message: "Mobigent.configure has not been called."
      });
    }

    if (this.options && totalCapabilityCount === 0) {
      issues.push({
        severity: "warn",
        code: "no_capabilities",
        message: "No actions, resources, or components are registered."
      });
    }

    if (this.options && this.connectionState !== "connected") {
      issues.push({
        severity: reconnectEnabled ? "info" : "warn",
        code: "not_connected",
        message: reconnectEnabled
          ? `Bridge is ${this.connectionState}; reconnect is enabled.`
          : `Bridge is ${this.connectionState}; reconnect is disabled.`
      });
    }

    if (this.eventQueue.length > 0) {
      issues.push({
        severity: "info",
        code: "queued_events",
        message: `${this.eventQueue.length} app event(s) are queued until the bridge reconnects.`
      });
    }

    if (this.lastError) {
      issues.push({
        severity: "error",
        code: "last_error",
        message: this.lastError
      });
    }

    return {
      configured: Boolean(this.options),
      appId: this.options?.appId,
      appName: this.options?.appName,
      gatewayUrl: this.options?.gatewayUrl,
      connectionState: this.connectionState,
      connected: this.connectionState === "connected",
      capabilityCounts: {
        actions: actionCount,
        resources: resourceCount,
        components: componentCount,
        total: totalCapabilityCount
      },
      queuedEventCount: this.eventQueue.length,
      reconnectEnabled,
      heartbeatEnabled,
      lastError: this.lastError,
      issues
    };
  }

  subscribeConnection(listener: MobigentConnectionListener) {
    this.connectionListeners.add(listener);
    listener(this.connectionState);

    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private async handleMessage(message: BridgeMessage) {
    if (message.type === "pong") {
      this.handlePong(message.id);
      return;
    }

    if (message.type === "call_action") {
      await this.handleActionCall(message.id, message.name, message.input);
      return;
    }

    if (message.type === "read_resource") {
      await this.handleResourceRead(message.id, message.name);
      return;
    }

    if (message.type === "focus_component") {
      await this.handleComponentFocus(message.id, message.name, message.props);
    }
  }

  private async handleActionCall(id: string, name: string, input: JsonObject) {
    const action = this.actions.get(name);
    if (!action) {
      this.send({ type: "action_result", id, ok: false, error: `Unknown action: ${name}` });
      return;
    }

    const parsedInput = objectInputSchema.safeParse(input);
    if (!parsedInput.success) {
      this.send({ type: "action_result", id, ok: false, error: "Action input must be an object." });
      return;
    }

    const validation = validateJsonSchema(action.inputSchema, parsedInput.data);
    if (!validation.ok) {
      this.send({
        type: "action_result",
        id,
        ok: false,
        error: `Invalid action input: ${validation.errors.join("; ")}`
      });
      return;
    }

    try {
      if (action.confirmation?.required) {
        const approved = await this.confirm(action, parsedInput.data);
        if (!approved) {
          this.send({ type: "action_result", id, ok: false, error: "User rejected action." });
          return;
        }
      }

      const result = await action.handler(parsedInput.data);
      if (action.outputSchema) {
        const outputValidation = validateJsonSchema(action.outputSchema, result);
        if (!outputValidation.ok) {
          this.send({
            type: "action_result",
            id,
            ok: false,
            error: `Invalid action output: ${outputValidation.errors.join("; ")}`
          });
          return;
        }
      }
      this.send({ type: "action_result", id, ok: true, result });
    } catch (error) {
      this.send({
        type: "action_result",
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleResourceRead(id: string, name: string) {
    const resource = this.resources.get(name);
    if (!resource) {
      this.send({ type: "resource_result", id, ok: false, error: `Unknown resource: ${name}` });
      return;
    }

    try {
      const result = await resource.read();
      if (resource.outputSchema) {
        const validation = validateJsonSchema(resource.outputSchema, result);
        if (!validation.ok) {
          this.send({
            type: "resource_result",
            id,
            ok: false,
            error: `Invalid resource output: ${validation.errors.join("; ")}`
          });
          return;
        }
      }
      this.send({ type: "resource_result", id, ok: true, result });
    } catch (error) {
      this.send({
        type: "resource_result",
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleComponentFocus(id: string, name: string, props: JsonObject) {
    const component = this.components.get(name);
    if (!component) {
      this.send({ type: "component_result", id, ok: false, error: `Unknown component: ${name}` });
      return;
    }

    const parsedProps = objectInputSchema.safeParse(props);
    if (!parsedProps.success) {
      this.send({ type: "component_result", id, ok: false, error: "Component props must be an object." });
      return;
    }

    if (component.propsSchema) {
      const validation = validateJsonSchema(component.propsSchema, parsedProps.data);
      if (!validation.ok) {
        this.send({
          type: "component_result",
          id,
          ok: false,
          error: `Invalid component props: ${validation.errors.join("; ")}`
        });
        return;
      }
    }

    try {
      const result = await component.focus(parsedProps.data);
      this.send({ type: "component_result", id, ok: true, result });
    } catch (error) {
      this.send({
        type: "component_result",
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async confirm(action: ActionDefinition, input: JsonObject) {
    if (this.options?.confirm) {
      return this.options.confirm({ action, input });
    }

    if (this.options?.confirmationController) {
      return this.options.confirmationController.request(action, input);
    }

    return true;
  }

  private async sendManifest() {
    if (!this.socket || this.socket.readyState !== OPEN || !this.options) {
      return;
    }

    const manifest = this.getManifest();
    this.send({
      type: "manifest",
      manifest,
      signature: this.options.signManifest ? await this.options.signManifest(manifest) : undefined
    });
  }

  private send(message: BridgeMessage) {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }

  private canSend() {
    return Boolean(this.socket && this.socket.readyState === OPEN);
  }

  private queueEvent(message: EventMessage) {
    const { enabled, maxSize } = this.getEventQueueOptions();
    if (!enabled || maxSize <= 0) {
      return false;
    }

    this.eventQueue.push(message);
    while (this.eventQueue.length > maxSize) {
      this.eventQueue.shift();
    }
    return true;
  }

  private flushEventQueue() {
    if (!this.canSend() || this.eventQueue.length === 0) {
      return;
    }

    const queued = this.eventQueue.splice(0);
    for (const message of queued) {
      this.send(message);
    }
  }

  private handleSocketClose() {
    this.stopHeartbeat();
    this.socket = undefined;

    if (this.manualDisconnect) {
      this.setConnectionState("disconnected");
      return;
    }

    if (!this.shouldReconnect()) {
      this.setConnectionState("disconnected");
      return;
    }

    const delayMs = this.getReconnectDelayMs(this.reconnectAttempts);
    this.setConnectionState("reconnecting");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.reconnectAttempts += 1;
      void this.connect().catch(() => {
        this.handleSocketClose();
      });
    }, delayMs);
  }

  private shouldReconnect() {
    const { enabled, maxAttempts } = this.getReconnectOptions();
    return enabled && this.reconnectAttempts < maxAttempts;
  }

  private getReconnectOptions(): Required<MobigentReconnectOptions> {
    const reconnect = this.options?.reconnect;
    if (reconnect === true) {
      return {
        enabled: true,
        maxAttempts: Infinity,
        delayMs: 1000,
        maxDelayMs: 30_000,
        backoffFactor: 2,
        jitterRatio: 0
      };
    }

    if (typeof reconnect === "object") {
      return {
        enabled: reconnect.enabled ?? true,
        maxAttempts: reconnect.maxAttempts ?? Infinity,
        delayMs: reconnect.delayMs ?? 1000,
        maxDelayMs: reconnect.maxDelayMs ?? 30_000,
        backoffFactor: reconnect.backoffFactor ?? 2,
        jitterRatio: reconnect.jitterRatio ?? 0
      };
    }

    return {
      enabled: false,
      maxAttempts: 0,
      delayMs: 1000,
      maxDelayMs: 30_000,
      backoffFactor: 2,
      jitterRatio: 0
    };
  }

  private getReconnectDelayMs(attemptsCompleted: number) {
    const { delayMs, maxDelayMs, backoffFactor, jitterRatio } = this.getReconnectOptions();
    const initialDelay = Math.max(0, delayMs);
    const cappedDelay = Math.max(initialDelay, maxDelayMs);
    const baseDelay = Math.min(
      cappedDelay,
      initialDelay * Math.max(1, backoffFactor) ** attemptsCompleted
    );
    const normalizedJitter = Math.max(0, Math.min(1, jitterRatio));
    if (normalizedJitter === 0) {
      return baseDelay;
    }

    const jitterRange = baseDelay * normalizedJitter;
    return Math.round(baseDelay - jitterRange + Math.random() * jitterRange * 2);
  }

  private getEventQueueOptions(): Required<MobigentEventQueueOptions> {
    const eventQueue = this.options?.eventQueue;
    if (eventQueue === true) {
      return { enabled: true, maxSize: 100 };
    }

    if (typeof eventQueue === "object") {
      return {
        enabled: eventQueue.enabled ?? true,
        maxSize: eventQueue.maxSize ?? 100
      };
    }

    return { enabled: false, maxSize: 0 };
  }

  private startHeartbeat() {
    const { enabled, intervalMs } = this.getHeartbeatOptions();
    this.stopHeartbeat();

    if (!enabled || intervalMs <= 0) {
      return;
    }

    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), intervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    this.clearHeartbeatTimeout();
    this.pendingHeartbeatId = undefined;
  }

  private sendHeartbeat() {
    const { timeoutMs } = this.getHeartbeatOptions();
    if (!this.canSend() || this.pendingHeartbeatId) {
      return;
    }

    const id = this.createMessageId("heartbeat");
    this.pendingHeartbeatId = id;
    this.send({
      type: "ping",
      id,
      at: new Date().toISOString()
    });

    if (timeoutMs > 0) {
      this.heartbeatTimeout = setTimeout(() => {
        if (this.pendingHeartbeatId === id) {
          this.socket?.close();
        }
      }, timeoutMs);
    }
  }

  private handlePong(id: string) {
    if (this.pendingHeartbeatId !== id) {
      return;
    }

    this.pendingHeartbeatId = undefined;
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = undefined;
    }
  }

  private getHeartbeatOptions(): Required<MobigentHeartbeatOptions> {
    const heartbeat = this.options?.heartbeat;
    if (heartbeat === true) {
      return {
        enabled: true,
        intervalMs: 30_000,
        timeoutMs: 10_000
      };
    }

    if (typeof heartbeat === "object") {
      return {
        enabled: heartbeat.enabled ?? true,
        intervalMs: heartbeat.intervalMs ?? 30_000,
        timeoutMs: heartbeat.timeoutMs ?? 10_000
      };
    }

    return {
      enabled: false,
      intervalMs: 30_000,
      timeoutMs: 10_000
    };
  }

  private createMessageId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private recordError(error: unknown) {
    this.lastError = error instanceof Error ? error.message : String(error);
  }

  private setConnectionState(state: MobigentConnectionState) {
    if (this.connectionState === state) {
      return;
    }

    this.connectionState = state;
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }

  private assertCapabilityName(name: string) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(
        `Invalid capability name "${name}". Use letters, numbers, and underscores, starting with a letter.`
      );
    }
  }

  private assertCapabilityAvailable(kind: "action" | "resource" | "component", name: string) {
    if (this.actions.has(name) || this.resources.has(name) || this.components.has(name)) {
      throw new Error(
        `Duplicate capability name "${name}". Unregister the existing capability before registering a ${kind} with the same name.`
      );
    }
  }
}

export function formatMobigentDiagnostics(
  diagnostics: MobigentDiagnostics,
  options: MobigentDiagnosticsFormatOptions = {}
) {
  const includeIssues = options.includeIssues ?? true;
  const includeGatewayUrl = options.includeGatewayUrl ?? true;
  const status = diagnostics.issues.some((issue) => issue.severity === "error")
    ? "ERROR"
    : diagnostics.issues.some((issue) => issue.severity === "warn")
      ? "WARN"
      : "OK";
  const lines = [
    `Mobigent app diagnostics: ${status}`,
    `configured: ${diagnostics.configured}`,
    diagnostics.appId ? `app: ${diagnostics.appName ?? diagnostics.appId} (${diagnostics.appId})` : undefined,
    includeGatewayUrl && diagnostics.gatewayUrl ? `gateway: ${diagnostics.gatewayUrl}` : undefined,
    `connection: ${diagnostics.connectionState}${diagnostics.connected ? " (connected)" : ""}`,
    `capabilities: ${diagnostics.capabilityCounts.total} total, ${diagnostics.capabilityCounts.actions} actions, ${diagnostics.capabilityCounts.resources} resources, ${diagnostics.capabilityCounts.components} components`,
    `queuedEvents: ${diagnostics.queuedEventCount}`,
    `reconnect: ${diagnostics.reconnectEnabled ? "enabled" : "disabled"}`,
    `heartbeat: ${diagnostics.heartbeatEnabled ? "enabled" : "disabled"}`,
    diagnostics.lastError ? `lastError: ${diagnostics.lastError}` : undefined
  ].filter((line): line is string => Boolean(line));

  if (includeIssues && diagnostics.issues.length > 0) {
    lines.push("issues:");
    for (const issue of diagnostics.issues) {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join("\n");
}

export const mobigent = new Mobigent();

export class AgentBridge extends Mobigent {}
export const agentBridge = mobigent;
export const intentBridge = mobigent;
