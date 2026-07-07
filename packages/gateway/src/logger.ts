/**
 * Structured logging abstraction for the Mobigent gateway.
 *
 * Provides a Logger interface that can be injected by embedders,
 * a default structured JSON logger, and helper functions for
 * correlation fields shared across the gateway.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  level: LogLevel;
  message: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Unique per-request correlation id. */
  requestId?: string;
  /** WebSocket session id. */
  sessionId?: string;
  /** Connected app id. */
  appId?: string;
  /** Agent/provider id. */
  agentId?: string;
  /** Tool name being called. */
  tool?: string;
  /** Event type for audit-aligned log events. */
  eventType?: string;
  /** Duration in milliseconds. */
  durationMs?: number;
  /** Outcome status. */
  status?: 'ok' | 'denied' | 'failed' | 'timeout' | 'error';
  /** Machine-readable error code. */
  errorCode?: string;
  /** Additional structured context (no secrets). */
  context?: Record<string, unknown>;
};

export interface Logger {
  debug(message: string, fields?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void;
  info(message: string, fields?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void;
  warn(message: string, fields?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void;
  error(message: string, fields?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void;
}

// ---------------------------------------------------------------------------
// Default structured JSON logger
// ---------------------------------------------------------------------------

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createConsoleLogger(minLevel: LogLevel = 'info'): Logger {
  const minOrder = LOG_LEVEL_ORDER[minLevel];

  function log(level: LogLevel, message: string, fields?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    if (LOG_LEVEL_ORDER[level] < minOrder) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...fields,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        process.stderr.write(`${output}\n`);
        break;
      case 'warn':
        process.stderr.write(`${output}\n`);
        break;
      default:
        process.stdout.write(`${output}\n`);
    }
  }

  return {
    debug: (msg, fields) => log('debug', msg, fields),
    info: (msg, fields) => log('info', msg, fields),
    warn: (msg, fields) => log('warn', msg, fields),
    error: (msg, fields) => log('error', msg, fields),
  };
}

// ---------------------------------------------------------------------------
// Gateway correlation helpers
// ---------------------------------------------------------------------------

/**
 * Collects common correlation context from gateway, session, and request state.
 */
export function buildLogContext(params: {
  sessionId?: string;
  appId?: string;
  agentId?: string;
  tool?: string;
  requestId?: string;
  eventType?: string;
}): Pick<LogEntry, 'sessionId' | 'appId' | 'agentId' | 'tool' | 'requestId' | 'eventType'> {
  return {
    sessionId: params.sessionId,
    appId: params.appId,
    agentId: params.agentId,
    tool: params.tool,
    requestId: params.requestId,
    eventType: params.eventType,
  };
}

// ---------------------------------------------------------------------------
// No-op logger for tests
// ---------------------------------------------------------------------------

export function createNoopLogger(): Logger {
  const noop = () => {};
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
}
