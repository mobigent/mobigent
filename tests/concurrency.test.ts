/**
 * Concurrency and load-behavior tests.
 *
 * Exercises the gateway under multiple simultaneous sessions,
 * concurrent tool calls, and idempotency under load.
 * These are correctness tests, not benchmarks — they verify
 * the gateway behaves correctly under concurrent use.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BridgeGateway, createHttpApp } from '@mobigent/gateway';
import { Mobigent } from '@mobigent/react-native';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple node WebSocket implementation matching the test pattern
import { WebSocket } from 'ws';

function createNodeSocket(url: string) {
  return new WebSocket(url) as unknown as import('@mobigent/react-native').MobigentSocket;
}

describe('gateway concurrency', () => {
  it('handles multiple simultaneous app sessions', async () => {
    const wsPort = 18_901;
    const httpPort = 18_902;
    const gateway = new BridgeGateway({ port: wsPort });
    const app = createHttpApp(gateway);
    let server: ReturnType<typeof app.listen> | undefined;

    gateway.start();
    server = app.listen(httpPort);

    const SESSION_COUNT = 10;
    const bridges: Mobigent[] = [];

    try {
      // Connect many apps simultaneously
      const connectPromises = Array.from({ length: SESSION_COUNT }, async (_, i) => {
        const bridge = new Mobigent();
        bridge.configure({
          appId: `com.mobigent.test.${i}`,
          appName: `Test App ${i}`,
          gatewayUrl: `ws://localhost:${wsPort}`,
          createSocket: createNodeSocket,
        });

        bridge.registerAction({
          name: `echo_${i}`,
          description: `Echo action for app ${i}.`,
          inputSchema: {
            type: 'object',
            properties: { value: { type: 'string' } },
          },
          handler: async (input) => input,
        });

        await bridge.connect();
        bridges.push(bridge);
        return bridge;
      });

      await Promise.all(connectPromises);
      await delay(100);

      // Verify all sessions are reflected
      const toolsResp = await fetch(`http://localhost:${httpPort}/tools`);
      assert.equal(toolsResp.status, 200);
      const { tools } = (await toolsResp.json()) as { tools: { name: string }[] };
      assert.equal(tools.length, SESSION_COUNT);

      // Verify each app's tool is discoverable
      for (let i = 0; i < SESSION_COUNT; i++) {
        assert.ok(
          tools.some((t) => t.name === `com_mobigent_test_${i}.echo_${i}`),
          `Tool for app ${i} should be discoverable`,
        );
      }

      // Concurrent reads across apps should all succeed
      const readResults = await Promise.all(
        Array.from({ length: SESSION_COUNT }, (_, i) =>
          fetch(`http://localhost:${httpPort}/tools/com_mobigent_test_${i}.echo_${i}/call`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ value: 'hello' }),
          }).then((r) => r.json()),
        ),
      );
      assert.ok(
        readResults.every((r) => r.result),
        'All concurrent reads should succeed',
      );
    } finally {
      await Promise.all(bridges.map((b) => b.disconnect()));
      gateway.stop();
      server?.close();
    }
  });

  it('handles concurrent tool calls on the same app', async () => {
    const wsPort = 18_903;
    const httpPort = 18_904;
    const gateway = new BridgeGateway({ port: wsPort });
    const app = createHttpApp(gateway);
    let server: ReturnType<typeof app.listen> | undefined;

    gateway.start();
    server = app.listen(httpPort);

    const bridge = new Mobigent();
    let callCount = 0;

    bridge.configure({
      appId: 'com.mobigent.concurrent',
      appName: 'Concurrent Test',
      gatewayUrl: `ws://localhost:${wsPort}`,
      createSocket: createNodeSocket,
    });

    bridge.registerAction({
      name: 'slow_echo',
      description: 'Echo with a small delay.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number' } },
      },
      handler: async (input) => {
        callCount++;
        await delay(20);
        return { id: input.id, count: callCount };
      },
    });

    try {
      await bridge.connect();
      await delay(50);

      const CONCURRENT = 20;
      const results = await Promise.all(
        Array.from({ length: CONCURRENT }, (_, i) =>
          fetch(`http://localhost:${httpPort}/tools/com_mobigent_concurrent.slow_echo/call`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: i }),
          }).then((r) => r.json().then((j) => j.result)),
        ),
      );

      // All calls should return distinct results
      assert.equal(results.length, CONCURRENT);
      const ids = results.map((r) => (r as { id: number }).id).sort((a, b) => a - b);
      assert.deepEqual(
        ids,
        Array.from({ length: CONCURRENT }, (_, i) => i),
      );

      // Handler should have been called for every request
      assert.equal(callCount, CONCURRENT);
    } finally {
      bridge.disconnect();
      gateway.stop();
      server?.close();
    }
  });

  it('idempotency deduplicates concurrent calls with the same key', async () => {
    const wsPort = 18_905;
    const httpPort = 18_906;
    const gateway = new BridgeGateway({ port: wsPort });
    const app = createHttpApp(gateway, {
      apiKey: 'concurrent-key',
    });
    let server: ReturnType<typeof app.listen> | undefined;

    gateway.start();
    server = app.listen(httpPort);

    const bridge = new Mobigent();
    let callCount = 0;

    bridge.configure({
      appId: 'com.mobigent.idempotent',
      appName: 'Idempotent Test',
      gatewayUrl: `ws://localhost:${wsPort}`,
      createSocket: createNodeSocket,
    });

    bridge.registerAction({
      name: 'unique_action',
      description: 'Action that tracks call count.',
      inputSchema: {
        type: 'object',
        properties: { payload: { type: 'string' } },
      },
      handler: async (input) => {
        callCount++;
        await delay(10);
        return { payload: input.payload, callNumber: callCount };
      },
    });

    try {
      await bridge.connect();
      await delay(50);

      // Fire 10 concurrent calls all with the same idempotency key
      const IDEM_KEY = 'dup-key-001';
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          fetch(`http://localhost:${httpPort}/tools/com_mobigent_idempotent.unique_action/call`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-mobigent-api-key': 'concurrent-key',
              'x-mobigent-idempotency-key': IDEM_KEY,
            },
            body: JSON.stringify({ payload: 'test' }),
          }).then((r) => r.json()),
        ),
      );

      // All should succeed (idempotent, not conflicting)
      assert.ok(results.every((r) => r.result));

      // The handler should have been called exactly once
      // (subsequent calls with the same key return the cached result)
      assert.equal(callCount, 1, 'Idempotency should deduplicate to exactly 1 handler call');

      // All results should be identical (same idempotency key → same result)
      const firstResult = JSON.stringify(results[0].result);
      for (const r of results) {
        assert.equal(JSON.stringify(r.result), firstResult);
      }
    } finally {
      bridge.disconnect();
      gateway.stop();
      server?.close();
    }
  });

  it('rate limiter handles concurrent requests correctly', async () => {
    const wsPort = 18_907;
    const httpPort = 18_908;
    const gateway = new BridgeGateway({ port: wsPort });
    const app = createHttpApp(gateway, {
      apiKey: 'rate-limit-key',
      httpRateLimitPerMinute: 5,
    });
    let server: ReturnType<typeof app.listen> | undefined;

    gateway.start();
    server = app.listen(httpPort);

    const bridge = new Mobigent();

    bridge.configure({
      appId: 'com.mobigent.ratelimited',
      appName: 'Rate Limited App',
      gatewayUrl: `ws://localhost:${wsPort}`,
      createSocket: createNodeSocket,
    });

    bridge.registerAction({
      name: 'fast_action',
      description: 'Fast action.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => ({ ok: true }),
    });

    try {
      await bridge.connect();
      await delay(50);

      const headers = { 'x-mobigent-api-key': 'rate-limit-key' };

      // Fire 10 concurrent requests (limit is 5/min)
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          fetch(`http://localhost:${httpPort}/tools/com_mobigent_ratelimited.fast_action/call`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...headers,
            },
            body: JSON.stringify({}),
          }).then((r) => ({ status: r.status, body: r.json() })),
        ),
      );

      const statuses = await Promise.all(results.map(async (r) => r.status));
      const okCount = statuses.filter((s) => s === 200).length;
      const limitedCount = statuses.filter((s) => s === 429).length;

      // At least some should succeed (the limit of 5)
      assert.ok(okCount >= 1 && okCount <= 5, `Expected 1-5 OK, got ${okCount}`);
      // The rest should be rate limited
      assert.equal(okCount + limitedCount, 10);
    } finally {
      bridge.disconnect();
      gateway.stop();
      server?.close();
    }
  });
});
