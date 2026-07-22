/**
 * Public exports snapshot test.
 *
 * Verifies that public package exports remain stable across changes.
 * Accidental removal or renaming of exports will fail this test.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Types that must be exported from each package
const expectedExports: Record<string, string[]> = {
  '@mobigent/core': [
    'canonicalJson',
    'validateCapabilityManifest',
    'toolName',
    'sanitize',
    'validateJsonSchema',
  ],
  '@mobigent/gateway': ['BridgeGateway', 'createHttpApp', 'createOpenApiSpec', 'createMcpServer'],
  '@mobigent/app': ['createApp', 'withMobigent'],
  '@mobigent/backend': ['startMobigent'],
};

describe('public package exports', () => {
  for (const [pkgName, requiredExports] of Object.entries(expectedExports)) {
    it(`${pkgName} exports required public symbols`, async () => {
      const mod = (await import(pkgName)) as Record<string, unknown>;

      for (const name of requiredExports) {
        assert.ok(
          name in mod,
          `${pkgName} must export "${name}". If this was intentionally removed, update the snapshot.`,
        );
      }
    });
  }

  it('@mobigent/core exports are callable', async () => {
    const core = (await import('@mobigent/core')) as Record<string, unknown>;

    assert.equal(typeof core.canonicalJson, 'function');
    assert.equal(typeof core.validateCapabilityManifest, 'function');
    assert.equal(typeof core.toolName, 'function');
    assert.equal(typeof core.sanitize, 'function');
    assert.equal(typeof core.validateJsonSchema, 'function');
  });

  it('@mobigent/gateway exports are callable or constructable', async () => {
    const gateway = (await import('@mobigent/gateway')) as Record<string, unknown>;

    assert.equal(typeof gateway.BridgeGateway, 'function');
    assert.equal(typeof gateway.createHttpApp, 'function');
    assert.equal(typeof gateway.createOpenApiSpec, 'function');
    assert.equal(typeof gateway.createMcpServer, 'function');
  });

  it('@mobigent/app exports are callable', async () => {
    const app = (await import('@mobigent/app')) as Record<string, unknown>;

    assert.equal(typeof app.createApp, 'function');
    assert.equal(typeof app.withMobigent, 'function');
  });

  it('@mobigent/backend exports are callable', async () => {
    const backend = (await import('@mobigent/backend')) as Record<string, unknown>;

    assert.equal(typeof backend.startMobigent, 'function');
  });
});
