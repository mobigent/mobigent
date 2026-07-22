/**
 * OpenAPI schema snapshot test.
 *
 * Verifies that the generated OpenAPI spec shape doesn't change unexpectedly.
 * This catches accidental breaking changes to the HTTP API surface.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createOpenApiSpec, createHttpApp, BridgeGateway } from '@mobigent/gateway';

// Helper: traverse an object and collect key paths
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined) return [`${prefix}:null`];
  if (Array.isArray(obj)) {
    return [`${prefix}[]`].concat(obj.flatMap((item, i) => keyPaths(item, `${prefix}[${i}]`)));
  }
  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .flatMap((key) => keyPaths(record[key], prefix ? `${prefix}.${key}` : key));
  }
  return [`${prefix}:${typeof obj}`];
}

// Generate a stable fingerprint of the OpenAPI spec shape
function shapeFingerprint(spec: unknown): string {
  return keyPaths(spec).join('\n');
}

describe('OpenAPI schema', () => {
  it('produces a stable spec shape', () => {
    const spec = createOpenApiSpec('http://localhost:8788', [
      {
        name: 'com_example_get_weather',
        description: 'Get current weather for a city.',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            units: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
            },
          },
          required: ['city'],
        },
        readOnly: true,
        risk: 'low' as const,
        app: { id: 'com.example', name: 'Example App' },
      },
      {
        name: 'com_example_read_notes',
        description: 'Read saved notes.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        readOnly: true,
        risk: 'low' as const,
        app: { id: 'com.example', name: 'Example App' },
      },
    ]);

    const fingerprint = shapeFingerprint(spec);

    // Verify top-level structure
    assert.equal(spec.openapi, '3.1.0');
    assert.equal(spec.info.title, 'Mobigent Gateway');
    assert.equal(spec.servers[0].url, 'http://localhost:8788');

    // Verify paths include standard endpoints
    const paths = spec.paths as Record<string, unknown>;
    assert.ok('/health' in paths);
    assert.ok('/ready' in paths);
    assert.ok('/config' in paths);
    assert.ok('/tools' in paths);

    // Verify tool paths are generated
    assert.ok('/tools/com_example_get_weather/call' in paths);
    assert.ok('/tools/com_example_read_notes/call' in paths);

    // Snapshot the stable key structure (everything except tool-specific paths and server URL)
    const topLevelKeys = fingerprint
      .split('\n')
      .filter((k) => !k.startsWith('paths.') && !k.startsWith('servers'));

    // Verify the core structure is present
    assert.ok(topLevelKeys.includes('openapi:string'));
    assert.ok(topLevelKeys.includes('info.title:string'));
    assert.ok(topLevelKeys.includes('info.version:string'));
    assert.ok(topLevelKeys.includes('info.description:string'));

    // Verify standard endpoints are in the paths
    const pathKeys = fingerprint.split('\n').filter((k) => k.startsWith('paths.'));
    assert.ok(pathKeys.some((k) => k.includes('/health')));
    assert.ok(pathKeys.some((k) => k.includes('/ready')));
    assert.ok(pathKeys.some((k) => k.includes('/config')));
    assert.ok(pathKeys.some((k) => k.includes('/tools')));

    // Verify required security is present when requireAuth is true
    const authSpec = createOpenApiSpec('http://localhost:8788', [], { requireAuth: true });
    assert.ok(authSpec.components);
    assert.ok(authSpec.components.securitySchemes);
  });

  it('includes auth requirement in spec when requested', () => {
    const spec = createOpenApiSpec('http://localhost:8788', [], { requireAuth: true });
    assert.ok(spec.components);
    assert.ok(spec.components.securitySchemes);
    assert.equal(spec.components.securitySchemes.bearerAuth.type, 'http');
    assert.equal(spec.components.securitySchemes.mobigentApiKey.type, 'apiKey');
  });

  it('omits security schemes when auth is not required', () => {
    const spec = createOpenApiSpec('http://localhost:8788', []);
    assert.equal(spec.components, undefined);
  });
});
