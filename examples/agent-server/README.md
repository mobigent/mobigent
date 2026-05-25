# Mobigent agent server examples

These examples show the other half of the SDK: agent-side code that discovers tools from an Mobigent HTTP gateway and maps them into different agent frameworks.

Run the offline demo without any gateway or API keys:

```bash
npm run demo -w @mobigent/example-agent-server
```

Use the provider-specific examples against a real gateway:

```bash
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/openai-responses.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/anthropic-tool-use.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/gemini-function-calling.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/aws-bedrock-converse.ts
MOBIGENT_HTTP_URL=http://localhost:8788 tsx examples/agent-server/vercel-ai-sdk.ts
```

Use the runtime starter when you want one provider-neutral entry point that waits for gateway readiness and policy-visible mobile tools, maps them into the selected provider shape, and optionally watches live capability changes:

```bash
MOBIGENT_PROVIDER=anthropic-tool-use \
MOBIGENT_MIN_APPS=1 \
MOBIGENT_MIN_TOOLS=1 \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server

MOBIGENT_PROVIDER=vercel-ai-sdk \
MOBIGENT_WATCH_TOOLS=true \
MOBIGENT_HTTP_URL=http://localhost:8788 \
npm run runtime -w @mobigent/example-agent-server
```

`MOBIGENT_PROVIDER` can be `openai-responses`, `openrouter`, `litellm`, `ollama`, `lm-studio`, `xai-grok`, `deepseek`, `together-ai`, `fireworks-ai`, `mistral`, `cohere`, `anthropic-tool-use`, `google-gemini`, `aws-bedrock-converse`, `vercel-ai-sdk`, `langchain`, `llamaindex`, `mastra`, `semantic-kernel`, `crewai`, `autogen`, `haystack`, or `generic-agent`.

The runtime starter uses `createMobigentProviderRuntimeFromEnv()` from `@mobigent/providers`, so production agent servers can reuse the same environment parsing, readiness wait, provider mapping, and retry defaults.
Set `MOBIGENT_DIAGNOSE=true` to print a formatted provider doctor report after startup.

Set `MOBIGENT_HTTP_API_KEY` when the gateway is protected. Each example sends a provider-specific `x-mobigent-agent` identity so gateway policies can allow or block tools per agent.
