import {
  createMobigentProviderRuntimeFromEnv,
  formatMobigentProviderDiagnostics,
  watchMobigentProviderRuntime,
} from '@mobigent/providers';

const controller = new AbortController();
const bootstrap = await createMobigentProviderRuntimeFromEnv({
  requestId: () => crypto.randomUUID(),
});
const { client, runtime } = bootstrap;
const readiness = bootstrap.readiness;

if (!readiness) {
  throw new Error('Runtime bootstrap did not return readiness.');
}

console.log(
  `Gateway ready: ${readiness.checks.apps.actual}/${readiness.checks.apps.required} app manifest(s), ` +
    `${readiness.checks.tools.actual}/${readiness.checks.tools.required} tool(s).`,
);

console.log(`Mobigent ${runtime.kind} runtime is ready.`);
console.log(
  `Loaded ${runtime.rawTools.length} mobile tool${runtime.rawTools.length === 1 ? '' : 's'}.`,
);
console.log(JSON.stringify(runtime.tools, null, 2));

if (process.env.MOBIGENT_DIAGNOSE === 'true') {
  const diagnostics = await client.diagnose({
    minApps: Number(process.env.MOBIGENT_MIN_APPS ?? 1),
    minTools: Number(process.env.MOBIGENT_MIN_TOOLS ?? 1),
    expectedProvider: runtime.kind,
  });
  console.log(formatMobigentProviderDiagnostics(diagnostics));
}

const sampleTool = runtime.rawTools[0];
if (sampleTool && process.env.MOBIGENT_EXECUTE_SAMPLE === 'true') {
  const sampleInput = process.env.MOBIGENT_SAMPLE_INPUT
    ? (JSON.parse(process.env.MOBIGENT_SAMPLE_INPUT) as Record<string, unknown>)
    : {};
  const result = await runtime.executeTool(sampleTool.name, sampleInput);
  console.log(`Executed ${sampleTool.name}.`);
  console.log(JSON.stringify(result, null, 2));
  console.log('Provider-formatted sample result:');
  console.log(
    JSON.stringify(
      runtime.formatToolCallResult({
        id: 'sample-call',
        name: sampleTool.name,
        input: sampleInput,
        result,
      }),
      null,
      2,
    ),
  );
}

if (process.env.MOBIGENT_WATCH_TOOLS === 'true') {
  console.log('Watching for live mobile capability changes. Press Ctrl+C to stop.');
  process.once('SIGINT', () => controller.abort());

  for await (const update of watchMobigentProviderRuntime({
    kind: runtime.kind,
    client,
    stream: { signal: controller.signal },
  })) {
    console.log(
      `${update.reason}: ${update.rawTools.length} tool${update.rawTools.length === 1 ? '' : 's'}`,
    );
  }
}
