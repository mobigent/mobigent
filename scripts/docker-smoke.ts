#!/usr/bin/env tsx
/**
 * Docker smoke test: build the gateway image, start a container,
 * and verify health/readiness/metrics endpoints respond.
 */

import { execSync } from 'node:child_process';

const IMAGE = 'mobigent-gateway:local-smoke';
const HTTP_PORT = '18788';

function run(cmd: string, opts?: { ignoreError?: boolean }): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (e: unknown) {
    if (opts?.ignoreError) return '';
    console.error(`Command failed: ${cmd}`);
    console.error(errorOutput(e));
    process.exit(1);
  }
}

function tryRun(cmd: string): { ok: true; output: string } | { ok: false; output: string } {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }) };
  } catch (e: unknown) {
    return { ok: false, output: errorOutput(e) };
  }
}

function errorOutput(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybeError = error as { stderr?: unknown; message?: unknown };
    if (typeof maybeError.stderr === 'string' && maybeError.stderr.trim()) {
      return maybeError.stderr;
    }
    if (Buffer.isBuffer(maybeError.stderr)) {
      return maybeError.stderr.toString('utf8');
    }
    if (typeof maybeError.message === 'string') {
      return maybeError.message;
    }
  }

  return String(error);
}

function cleanup() {
  run(`docker rm -f mobigent-smoke 2>/dev/null || true`, { ignoreError: true });
  run(`docker rmi ${IMAGE} 2>/dev/null || true`, { ignoreError: true });
}

try {
  console.log('Building Docker image...');
  run(`docker build -t ${IMAGE} .`);
  console.log('  Image built.');

  // Remove any previous container
  run(`docker rm -f mobigent-smoke 2>/dev/null || true`, { ignoreError: true });

  console.log('Starting container...');
  run(`docker run -d --name mobigent-smoke -p ${HTTP_PORT}:8788 ${IMAGE}`);

  // Wait for startup
  console.log('Waiting for gateway startup...');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const health = tryRun(`curl -sf http://localhost:${HTTP_PORT}/health`);
    if (health.ok) {
      ready = true;
      console.log('  Health endpoint OK:', health.output.trim());
      break;
    }

    execSync('sleep 1', { stdio: 'pipe' });
  }

  if (!ready) {
    console.error('Gateway did not become healthy within 30s');
    const logs = run(`docker logs mobigent-smoke 2>&1 || true`, {
      ignoreError: true,
    });
    console.error('Container logs:', logs);
    throw new Error('Gateway did not become healthy within 30s');
  }

  // Verify readiness
  const readyCheck = tryRun(`curl -sf http://localhost:${HTTP_PORT}/ready`);
  if (readyCheck.ok) {
    console.log('  Readiness endpoint OK:', readyCheck.output.trim());
  } else {
    console.log('  Readiness endpoint returned non-200 (expected when no apps connected).');
  }

  // Verify Prometheus metrics
  const metrics = tryRun(`curl -sf http://localhost:${HTTP_PORT}/metrics/prometheus`);
  if (!metrics.ok) {
    console.error('  Metrics endpoint not reachable.');
    throw new Error('Metrics endpoint not reachable.');
  }

  const metricsOut = metrics.output;
  if (metricsOut.includes('mobigent_') || metricsOut.includes('process_')) {
    console.log('  Prometheus metrics OK (endpoint reachable).');
  } else {
    console.log('  Metrics endpoint reachable but unexpected output.');
  }

  // Verify health again for good measure
  run(`curl -sf http://localhost:${HTTP_PORT}/health`);
  console.log('  Final health check OK.');

  console.log('Docker smoke test passed.');
} finally {
  console.log('Cleaning up...');
  cleanup();
}
