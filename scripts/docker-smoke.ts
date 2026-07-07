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
  } catch (e: any) {
    if (opts?.ignoreError) return '';
    console.error(`Command failed: ${cmd}`);
    console.error(e.stderr || e.message);
    process.exit(1);
  }
}

console.log('Building Docker image...');
run(`docker build -t ${IMAGE} .`);
console.log('  Image built.');

// Remove any previous container
run(`docker rm -f mobigent-smoke 2>/dev/null || true`, { ignoreError: true });

console.log('Starting container...');
run(
  `docker run -d --name mobigent-smoke -p ${HTTP_PORT}:8788 ${IMAGE}`,
);

// Wait for startup
console.log('Waiting for gateway startup...');
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const out = run(`curl -sf http://localhost:${HTTP_PORT}/health`);
    ready = true;
    console.log('  Health endpoint OK:', out.trim());
    break;
  } catch {
    execSync('sleep 1', { stdio: 'pipe' });
  }
}

if (!ready) {
  console.error('Gateway did not become healthy within 30s');
  const logs = run(`docker logs mobigent-smoke 2>&1 || true`, {
    ignoreError: true,
  });
  console.error('Container logs:', logs);
  process.exit(1);
}

// Verify readiness
try {
  const readyOut = run(`curl -sf http://localhost:${HTTP_PORT}/ready`);
  console.log('  Readiness endpoint OK:', readyOut.trim());
} catch {
  console.log('  Readiness endpoint returned non-200 (expected when no apps connected).');
}

// Verify Prometheus metrics
try {
  const metricsOut = run(`curl -sf http://localhost:${HTTP_PORT}/metrics/prometheus`);
  if (metricsOut.includes('mobigent_') || metricsOut.includes('process_')) {
    console.log('  Prometheus metrics OK (endpoint reachable).');
  } else {
    console.log('  Metrics endpoint reachable but unexpected output.');
  }
} catch {
  console.error('  Metrics endpoint not reachable.');
  process.exit(1);
}

// Verify health again for good measure
run(`curl -sf http://localhost:${HTTP_PORT}/health`);
console.log('  Final health check OK.');

// Cleanup
console.log('Cleaning up...');
run(`docker rm -f mobigent-smoke`);
run(`docker rmi ${IMAGE} 2>/dev/null || true`, { ignoreError: true });

console.log('Docker smoke test passed.');
