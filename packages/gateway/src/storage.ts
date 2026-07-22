/**
 * Storage interfaces and implementations for durable gateway state.
 *
 * - AuditSink: persist audit events outside process memory
 * - IdempotencyStore: persist idempotency records across restarts
 * - RateLimitStore: shared rate-limit tracking for scaled deployments
 *
 * Each interface has a memory implementation (default for local use) and
 * at least one durable implementation suitable for production.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AuditEvent } from './BridgeGateway.js';

// ---------------------------------------------------------------------------
// AuditSink
// ---------------------------------------------------------------------------

export interface AuditSink {
  /** Append one audit event. May be async for durable sinks. */
  write(event: AuditEvent): void | Promise<void>;
  /** Optional: called on graceful shutdown to flush pending writes. */
  flush?(): void | Promise<void>;
}

/**
 * In-memory audit sink. Stores up to `limit` events in a ring buffer.
 * This is the default for local development.
 */
export class MemoryAuditSink implements AuditSink {
  private events: AuditEvent[] = [];
  private limit: number;

  constructor(limit = 500) {
    this.limit = limit;
  }

  write(event: AuditEvent): void {
    this.events.push(event);
    if (this.events.length > this.limit) {
      this.events.shift();
    }
  }

  getEvents(limit?: number): AuditEvent[] {
    if (limit === undefined) return [...this.events];
    return this.events.slice(-limit);
  }

  get size(): number {
    return this.events.length;
  }
}

/**
 * JSONL file audit sink. Appends one JSON line per audit event.
 * Suitable for single-instance production when paired with a log shipper.
 */
export class JsonlAuditSink implements AuditSink {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    // Ensure parent directory exists
    try {
      mkdirSync(dirname(filePath), { recursive: true });
    } catch {
      // Directory may already exist; ignore.
    }
  }

  write(event: AuditEvent): void {
    appendFileSync(this.filePath, `${JSON.stringify(event)}\n`);
  }
}

// ---------------------------------------------------------------------------
// IdempotencyStore
// ---------------------------------------------------------------------------

export interface IdempotencyRecord {
  key: string;
  inputHash: string;
  createdAt: number;
  lastUsedAt: number;
  settled: boolean;
  result?: unknown;
}

export interface IdempotencyStore {
  /**
   * Get an existing record by key, or undefined if not found.
   */
  get(key: string): IdempotencyRecord | undefined | Promise<IdempotencyRecord | undefined>;

  /**
   * Set a record. Implementations should use compare-and-swap semantics
   * when available to prevent races in concurrent deployments.
   */
  set(key: string, record: IdempotencyRecord): void | Promise<void>;

  /**
   * Delete a record by key.
   */
  delete(key: string): void | Promise<void>;

  /**
   * Iterate over all records for cleanup.
   * Returns all keys for memory implementation.
   */
  entries():
    IterableIterator<[string, IdempotencyRecord]> | Promise<Array<[string, IdempotencyRecord]>>;

  /** Number of records currently stored. */
  readonly size: number;
}

/**
 * In-memory idempotency store. Matches the current BridgeGateway behavior.
 */
export class MemoryIdempotencyStore implements IdempotencyStore {
  private records = new Map<string, IdempotencyRecord>();

  get(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  set(key: string, record: IdempotencyRecord): void {
    this.records.set(key, record);
  }

  delete(key: string): void {
    this.records.delete(key);
  }

  entries(): IterableIterator<[string, IdempotencyRecord]> {
    return this.records.entries();
  }

  get size(): number {
    return this.records.size;
  }

  clear(): void {
    this.records.clear();
  }
}

// ---------------------------------------------------------------------------
// RateLimitStore
// ---------------------------------------------------------------------------

export interface RateLimitStore {
  /**
   * Record a call timestamp and return whether the rate limit is exceeded.
   * @param key — composite key (e.g. `${agentId}:${tool}`)
   * @param limit — max calls per window
   * @param windowMs — sliding window duration in ms
   * @returns true if the call is allowed, false if rate limited
   */
  consume(key: string, limit: number, windowMs: number): boolean | Promise<boolean>;

  /**
   * Remove expired entries. Called periodically.
   */
  cleanup(now: number, windowMs: number): void | Promise<void>;

  /** Number of active buckets. */
  readonly size: number;
}

/**
 * In-memory rate-limit store. Matches the current BridgeGateway behavior.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, number[]>();

  consume(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    const calls = (this.buckets.get(key) ?? []).filter((ts) => ts > windowStart);

    if (calls.length >= limit) {
      this.buckets.set(key, calls);
      return false;
    }

    calls.push(now);
    this.buckets.set(key, calls);
    return true;
  }

  cleanup(now: number, windowMs: number): void {
    const cutoff = now - windowMs;
    for (const [key, calls] of this.buckets) {
      const filtered = calls.filter((ts) => ts > cutoff);
      if (filtered.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, filtered);
      }
    }
  }

  get size(): number {
    return this.buckets.size;
  }

  clear(): void {
    this.buckets.clear();
  }
}

// ---------------------------------------------------------------------------
// Composite storage container
// ---------------------------------------------------------------------------

export interface GatewayStorage {
  audit: AuditSink;
  idempotency: IdempotencyStore;
  rateLimit: RateLimitStore;
}

/**
 * Create a full in-memory storage stack for local development.
 */
export function createMemoryStorage(auditLimit = 500): GatewayStorage {
  return {
    audit: new MemoryAuditSink(auditLimit),
    idempotency: new MemoryIdempotencyStore(),
    rateLimit: new MemoryRateLimitStore(),
  };
}

/**
 * Create a production storage stack with JSONL audit and memory stores.
 * Memory idempotency/rate-limit are used until durable backends are configured.
 */
export function createProductionStorage(auditLogPath?: string): GatewayStorage {
  return {
    audit: auditLogPath ? new JsonlAuditSink(auditLogPath) : new MemoryAuditSink(1000),
    idempotency: new MemoryIdempotencyStore(),
    rateLimit: new MemoryRateLimitStore(),
  };
}
