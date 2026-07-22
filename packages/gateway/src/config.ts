/**
 * Typed production configuration loader for the Mobigent gateway.
 *
 * Centralizes all MOBIGENT_* env-var parsing, validates types,
 * redacts secrets in diagnostics, and enforces production-mode
 * safety checks.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GatewayConfig = {
  /** WebSocket port for app sessions (default 8787). */
  wsPort: number;
  /** HTTP API port (default 8788). */
  httpPort: number;
  /** App auth token required for WebSocket sessions. */
  authToken?: string;
  /** HTTP API key for bearer-token auth on the HTTP API. */
  httpApiKey?: string;
  /** Per-agent HTTP API keys (agentId → key). */
  httpAgentApiKeys?: Record<string, string>;
  /** Maximum JSON body size for HTTP requests (e.g. "100kb"). */
  httpJsonBodyLimit?: string;
  /** Allowed CORS origins. */
  httpCorsOrigins?: string[];
  /** Path for JSONL audit log output. */
  auditLogPath?: string;
  /** Additional keys to redact from audit/log output. */
  auditRedactKeys?: string[];
  /** Secret for verifying signed capability manifests. */
  manifestSigningSecret?: string;
  /** Set of app ids allowed to connect. */
  allowedAppIds?: string[];
  /** Agent profiles (agentId → profile). */
  agentProfiles?: Record<string, import('./BridgeGateway.js').AgentProfile>;
  /** TTL for idempotency records in ms. */
  idempotencyRecordTtlMs?: number;
  /** Interval for cleaning up expired records in ms. */
  cleanupIntervalMs?: number;

  // -- Production safety --
  /** Deployment environment: "production", "staging", or "development". */
  env: 'production' | 'staging' | 'development';
  /** Whether to fail on missing production controls (env=production). */
  strictProductionMode: boolean;

  // -- Endpoint policy --
  /** Policy for /health endpoint exposure. */
  healthEndpoint: EndpointPolicy;
  /** Policy for /ready endpoint exposure. */
  readyEndpoint: EndpointPolicy;
  /** Policy for /config endpoint exposure. */
  configEndpoint: EndpointPolicy;
  /** Policy for /openapi.json endpoint exposure. */
  openApiEndpoint: EndpointPolicy;

  // -- Inspector --
  /** Inspector access mode. */
  inspectorMode: InspectorMode;
};

export type EndpointPolicy =
  | 'public' // No auth required
  | 'protected' // Requires HTTP API key when auth is configured
  | 'disabled'; // Return 404 or 403

export type InspectorMode =
  | 'enabled' // Inspector available (development default)
  | 'disabled' // Inspector returns 404
  | 'protected' // Inspector requires HTTP auth when configured
  | 'internal'; // Inspector binds to loopback only (future)

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS = {
  wsPort: 8787,
  httpPort: 8788,
  env: 'development' as const,
  healthEndpoint: 'public' as const,
  readyEndpoint: 'public' as const,
  configEndpoint: 'public' as const,
  openApiEndpoint: 'public' as const,
  inspectorMode: 'enabled' as const,
};

const PRODUCTION_DEFAULTS: Partial<GatewayConfig> = {
  healthEndpoint: 'public',
  readyEndpoint: 'public',
  configEndpoint: 'protected',
  openApiEndpoint: 'protected',
  inspectorMode: 'disabled',
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function envStr(key: string, fallback?: string): string | undefined {
  const v = process.env[key];
  return v !== undefined ? v : fallback;
}

function envNum(key: string, fallback?: number): number | undefined {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${key} must be a number, got "${v}"`);
  return n;
}

function envBool(key: string, fallback?: boolean): boolean | undefined {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const l = v.toLowerCase();
  if (l === '1' || l === 'true' || l === 'yes' || l === 'on') return true;
  if (l === '0' || l === 'false' || l === 'no' || l === 'off') return false;
  throw new Error(`${key} must be a boolean (true/false/1/0), got "${v}"`);
}

function envList(key: string): string[] | undefined {
  const v = process.env[key];
  if (v === undefined) return undefined;
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAgentProfiles(
  raw: string,
): Record<string, import('./BridgeGateway.js').AgentProfile> {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('MOBIGENT_AGENT_PROFILES must be a JSON object');
  }
  return parsed as Record<string, import('./BridgeGateway.js').AgentProfile>;
}

function parseStringMap(raw: string, envName: string): Record<string, string> {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${envName} must be a JSON object`);
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string' || !value) {
      throw new Error(`${envName}: key "${key}" must map to a non-empty string`);
    }
  }
  return parsed as Record<string, string>;
}

function validateEndpointPolicy(value: string, key: string): EndpointPolicy {
  if (!['public', 'protected', 'disabled'].includes(value)) {
    throw new Error(`${key} must be one of: public, protected, disabled. Got "${value}"`);
  }
  return value as EndpointPolicy;
}

function validateInspectorMode(value: string): InspectorMode {
  if (!['enabled', 'disabled', 'protected', 'internal'].includes(value)) {
    throw new Error(
      `MOBIGENT_INSPECTOR must be one of: enabled, disabled, protected, internal. Got "${value}"`,
    );
  }
  return value as InspectorMode;
}

function validateEnv(value: string): 'production' | 'staging' | 'development' {
  const l = value.toLowerCase();
  if (!['production', 'staging', 'development'].includes(l)) {
    throw new Error(
      `MOBIGENT_ENV must be one of: production, staging, development. Got "${value}"`,
    );
  }
  return l as 'production' | 'staging' | 'development';
}

// ---------------------------------------------------------------------------
// Secret redaction
// ---------------------------------------------------------------------------

function redact(value: unknown): unknown {
  if (typeof value === 'string' && value.length > 0) {
    if (value.length <= 4) return '***';
    return value.slice(0, 2) + '***' + value.slice(-2);
  }
  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      redacted[k] = v;
    }
    return '(object)';
  }
  return value ?? '(unset)';
}

// ---------------------------------------------------------------------------
// Config loader
// ---------------------------------------------------------------------------

export function loadGatewayConfig(overrides?: Partial<GatewayConfig>): GatewayConfig {
  const problems: string[] = [];

  function capture<T>(fn: () => T, fallback: T): T {
    try {
      return fn();
    } catch (e: unknown) {
      problems.push(e instanceof Error ? e.message : String(e));
      return fallback;
    }
  }

  const env = capture(() => validateEnv(envStr('MOBIGENT_ENV', DEFAULTS.env)!), DEFAULTS.env);

  const strictProductionMode = capture(
    () => envBool('MOBIGENT_STRICT_PRODUCTION', env === 'production') ?? env === 'production',
    env === 'production',
  );

  const wsPort = capture(() => envNum('MOBIGENT_WS_PORT', DEFAULTS.wsPort)!, DEFAULTS.wsPort);
  const httpPort = capture(
    () => envNum('MOBIGENT_HTTP_PORT', DEFAULTS.httpPort)!,
    DEFAULTS.httpPort,
  );
  const authToken = capture(() => envStr('MOBIGENT_AUTH_TOKEN'), undefined);
  const httpApiKey = capture(() => envStr('MOBIGENT_HTTP_API_KEY'), undefined);
  const httpAgentApiKeys = capture(() => {
    const raw = envStr('MOBIGENT_HTTP_AGENT_API_KEYS');
    return raw ? parseStringMap(raw, 'MOBIGENT_HTTP_AGENT_API_KEYS') : undefined;
  }, undefined);
  const httpJsonBodyLimit = capture(() => envStr('MOBIGENT_HTTP_JSON_LIMIT'), undefined);
  const httpCorsOrigins = capture(() => envList('MOBIGENT_HTTP_CORS_ORIGINS'), undefined);
  const auditLogPath = capture(() => envStr('MOBIGENT_AUDIT_LOG_PATH'), undefined);
  const auditRedactKeys = capture(() => envList('MOBIGENT_AUDIT_REDACT_KEYS'), undefined);
  const manifestSigningSecret = capture(
    () => envStr('MOBIGENT_MANIFEST_SIGNING_SECRET'),
    undefined,
  );
  const allowedAppIds = capture(() => envList('MOBIGENT_ALLOWED_APP_IDS'), undefined);
  const agentProfiles = capture(() => {
    const raw = envStr('MOBIGENT_AGENT_PROFILES');
    return raw ? parseAgentProfiles(raw) : undefined;
  }, undefined);
  const idempotencyRecordTtlMs = capture(
    () => envNum('MOBIGENT_IDEMPOTENCY_RECORD_TTL_MS'),
    undefined,
  );
  const cleanupIntervalMs = capture(() => envNum('MOBIGENT_CLEANUP_INTERVAL_MS'), undefined);

  // Endpoint policy
  const healthEndpoint = capture(
    () =>
      envStr('MOBIGENT_HEALTH_ENDPOINT')
        ? validateEndpointPolicy(envStr('MOBIGENT_HEALTH_ENDPOINT')!, 'MOBIGENT_HEALTH_ENDPOINT')
        : env === 'production'
          ? PRODUCTION_DEFAULTS.healthEndpoint!
          : DEFAULTS.healthEndpoint,
    DEFAULTS.healthEndpoint,
  );

  const readyEndpoint = capture(
    () =>
      envStr('MOBIGENT_READY_ENDPOINT')
        ? validateEndpointPolicy(envStr('MOBIGENT_READY_ENDPOINT')!, 'MOBIGENT_READY_ENDPOINT')
        : env === 'production'
          ? PRODUCTION_DEFAULTS.readyEndpoint!
          : DEFAULTS.readyEndpoint,
    DEFAULTS.readyEndpoint,
  );

  const configEndpoint = capture(
    () =>
      envStr('MOBIGENT_CONFIG_ENDPOINT')
        ? validateEndpointPolicy(envStr('MOBIGENT_CONFIG_ENDPOINT')!, 'MOBIGENT_CONFIG_ENDPOINT')
        : env === 'production'
          ? PRODUCTION_DEFAULTS.configEndpoint!
          : DEFAULTS.configEndpoint,
    DEFAULTS.configEndpoint,
  );

  const openApiEndpoint = capture(
    () =>
      envStr('MOBIGENT_OPENAPI_ENDPOINT')
        ? validateEndpointPolicy(envStr('MOBIGENT_OPENAPI_ENDPOINT')!, 'MOBIGENT_OPENAPI_ENDPOINT')
        : env === 'production'
          ? PRODUCTION_DEFAULTS.openApiEndpoint!
          : DEFAULTS.openApiEndpoint,
    DEFAULTS.openApiEndpoint,
  );

  const inspectorMode = capture(
    () =>
      envStr('MOBIGENT_INSPECTOR')
        ? validateInspectorMode(envStr('MOBIGENT_INSPECTOR')!)
        : env === 'production'
          ? PRODUCTION_DEFAULTS.inspectorMode!
          : DEFAULTS.inspectorMode,
    DEFAULTS.inspectorMode,
  );

  const config: GatewayConfig = {
    wsPort,
    httpPort,
    authToken,
    httpApiKey,
    httpAgentApiKeys,
    httpJsonBodyLimit,
    httpCorsOrigins,
    auditLogPath,
    auditRedactKeys,
    manifestSigningSecret,
    allowedAppIds,
    agentProfiles,
    idempotencyRecordTtlMs,
    cleanupIntervalMs,
    env,
    strictProductionMode,
    healthEndpoint,
    readyEndpoint,
    configEndpoint,
    openApiEndpoint,
    inspectorMode,
    ...overrides,
  };

  if (
    overrides?.env &&
    overrides.strictProductionMode === undefined &&
    envStr('MOBIGENT_STRICT_PRODUCTION') === undefined
  ) {
    config.strictProductionMode = config.env === 'production';
  }
  if (!overrides?.healthEndpoint && envStr('MOBIGENT_HEALTH_ENDPOINT') === undefined) {
    config.healthEndpoint =
      config.env === 'production' ? PRODUCTION_DEFAULTS.healthEndpoint! : DEFAULTS.healthEndpoint;
  }
  if (!overrides?.readyEndpoint && envStr('MOBIGENT_READY_ENDPOINT') === undefined) {
    config.readyEndpoint =
      config.env === 'production' ? PRODUCTION_DEFAULTS.readyEndpoint! : DEFAULTS.readyEndpoint;
  }
  if (!overrides?.configEndpoint && envStr('MOBIGENT_CONFIG_ENDPOINT') === undefined) {
    config.configEndpoint =
      config.env === 'production' ? PRODUCTION_DEFAULTS.configEndpoint! : DEFAULTS.configEndpoint;
  }
  if (!overrides?.openApiEndpoint && envStr('MOBIGENT_OPENAPI_ENDPOINT') === undefined) {
    config.openApiEndpoint =
      config.env === 'production' ? PRODUCTION_DEFAULTS.openApiEndpoint! : DEFAULTS.openApiEndpoint;
  }
  if (!overrides?.inspectorMode && envStr('MOBIGENT_INSPECTOR') === undefined) {
    config.inspectorMode =
      config.env === 'production' ? PRODUCTION_DEFAULTS.inspectorMode! : DEFAULTS.inspectorMode;
  }

  // Production safety checks
  const warnings: string[] = [];
  if (config.env === 'production') {
    if (!config.authToken) {
      const msg = 'MOBIGENT_AUTH_TOKEN is not set. App sessions will not require authentication.';
      if (config.strictProductionMode) problems.push(msg);
      else warnings.push(msg);
    }
    if (!config.httpApiKey && !config.httpAgentApiKeys) {
      const msg = 'No HTTP API key configured. HTTP endpoints will not require authentication.';
      if (config.strictProductionMode) problems.push(msg);
      else warnings.push(msg);
    }
    if (!config.allowedAppIds?.length) {
      warnings.push('MOBIGENT_ALLOWED_APP_IDS is not set. Any app id can connect.');
    }
    if (!config.manifestSigningSecret) {
      warnings.push(
        'MOBIGENT_MANIFEST_SIGNING_SECRET is not set. Manifest signatures will not be verified.',
      );
    }
    if (config.inspectorMode === 'enabled') {
      const msg =
        'Inspector is enabled in production. Set MOBIGENT_INSPECTOR=disabled or MOBIGENT_INSPECTOR=protected.';
      if (config.strictProductionMode) problems.push(msg);
      else warnings.push(msg);
    }
    if (!config.httpCorsOrigins?.length) {
      warnings.push('MOBIGENT_HTTP_CORS_ORIGINS is not set. CORS will allow all origins.');
    }
    if (!config.httpJsonBodyLimit) {
      warnings.push(
        'MOBIGENT_HTTP_JSON_LIMIT is not set. Consider setting a limit (e.g. "100kb").',
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(`Gateway configuration errors:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }

  if (warnings.length > 0) {
    console.warn(`Gateway configuration warnings:\n${warnings.map((w) => `  - ${w}`).join('\n')}`);
  }

  return config;
}

/**
 * Return a diagnostics summary suitable for startup logging.
 * Secret values are redacted.
 */
export function configDiagnostics(config: GatewayConfig): Record<string, unknown> {
  return {
    env: config.env,
    strictProduction: config.strictProductionMode,
    wsPort: config.wsPort,
    httpPort: config.httpPort,
    authToken: redact(config.authToken),
    httpApiKey: redact(config.httpApiKey),
    httpAgentApiKeys: redact(config.httpAgentApiKeys),
    httpJsonBodyLimit: config.httpJsonBodyLimit ?? '(unlimited)',
    httpCorsOrigins: config.httpCorsOrigins?.length ? config.httpCorsOrigins.join(', ') : '(all)',
    auditLogPath: config.auditLogPath ?? '(memory only)',
    auditRedactKeys: config.auditRedactKeys?.join(', ') ?? '(defaults only)',
    manifestSigningSecret: redact(config.manifestSigningSecret),
    allowedAppIds: config.allowedAppIds?.join(', ') ?? '(all)',
    agentProfileCount: Object.keys(config.agentProfiles ?? {}).length,
    idempotencyRecordTtlMs: config.idempotencyRecordTtlMs ?? '(default)',
    cleanupIntervalMs: config.cleanupIntervalMs ?? '(default)',
    healthEndpoint: config.healthEndpoint,
    readyEndpoint: config.readyEndpoint,
    configEndpoint: config.configEndpoint,
    openApiEndpoint: config.openApiEndpoint,
    inspectorMode: config.inspectorMode,
  };
}
