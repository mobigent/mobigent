/**
 * Provider adapter fixture tests.
 *
 * Verifies that tool-name mapping and provider-format conversion functions
 * produce the expected output shapes for each supported provider format.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  toOpenAiTools,
  toChatFunctionTools,
  toAnthropicTools,
  toGeminiFunctionDeclarations,
  toBedrockToolConfigTools,
  createProviderSafeToolNameMap,
  mapToolsForProviderNames,
  resolveMobigentToolCall,
  formatMobigentToolCallResult,
} from '@mobigent/providers';
import type { MobigentHttpTool } from '@mobigent/providers';

const sampleTools: MobigentHttpTool[] = [
  {
    name: 'com_acme_expenses_create_expense',
    description: 'Create an expense report.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Expense amount in USD.' },
        category: { type: 'string', description: 'Expense category.' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'com_acme_expenses_read_expenses',
    description: 'Read saved expense reports.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        expenses: { type: 'array' },
      },
    },
  },
];

describe('provider tool converters', () => {
  it('toOpenAiTools produces valid OpenAI function tool definitions', () => {
    const result = toOpenAiTools(sampleTools);

    assert.equal(result.length, 2);
    assert.equal(result[0].type, 'function');
    assert.equal(result[0].name, 'com_acme_expenses_create_expense');
    assert.equal(result[0].description, 'Create an expense report.');
    assert.deepEqual(result[0].parameters, sampleTools[0].inputSchema);
  });

  it('toChatFunctionTools wraps tools in chat-completion function shape', () => {
    const result = toChatFunctionTools(sampleTools);

    assert.equal(result.length, 2);
    assert.equal(result[0].type, 'function');
    assert.equal(result[0].function.name, 'com_acme_expenses_create_expense');
    assert.equal(result[0].function.description, 'Create an expense report.');
    assert.deepEqual(result[0].function.parameters, sampleTools[0].inputSchema);
  });

  it('toAnthropicTools produces valid Anthropic tool definitions', () => {
    const result = toAnthropicTools(sampleTools);

    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'com_acme_expenses_create_expense');
    assert.equal(result[0].description, 'Create an expense report.');
    assert.deepEqual(result[0].input_schema, sampleTools[0].inputSchema);
  });

  it('toGeminiFunctionDeclarations produces valid Gemini function declarations', () => {
    const result = toGeminiFunctionDeclarations(sampleTools);

    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'com_acme_expenses_create_expense');
    assert.equal(result[0].description, 'Create an expense report.');
    assert.deepEqual(result[0].parameters, sampleTools[0].inputSchema);
  });

  it('toBedrockToolConfigTools wraps tools in Bedrock toolSpec shape', () => {
    const result = toBedrockToolConfigTools(sampleTools);

    assert.equal(result.length, 2);
    assert.equal(result[0].toolSpec.name, 'com_acme_expenses_create_expense');
    assert.equal(result[0].toolSpec.description, 'Create an expense report.');
    assert.deepEqual(result[0].toolSpec.inputSchema.json, sampleTools[0].inputSchema);
  });
});

describe('provider-safe tool names', () => {
  it('mapToolsForProviderNames in preserve mode keeps original names', () => {
    const result = mapToolsForProviderNames(sampleTools, { mode: 'preserve' });

    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].originalName, result.entries[0].providerName);
    assert.equal(
      result.resolve('com_acme_expenses_create_expense'),
      'com_acme_expenses_create_expense',
    );
  });

  it('createProviderSafeToolNameMap sanitizes tool names for providers', () => {
    const result = createProviderSafeToolNameMap(sampleTools);

    assert.equal(result.entries.length, 2);
    // Provider-safe names should be normalized (dots, colons, hyphens → underscores)
    for (const entry of result.entries) {
      assert.ok(
        /^[a-zA-Z0-9_]+$/.test(entry.providerName),
        `"${entry.providerName}" should be safe`,
      );
      assert.ok(entry.providerName.length <= 64, `"${entry.providerName}" should be ≤ 64 chars`);
    }
    // Round-trip resolution works
    const resolved = result.resolve(result.entries[0].providerName);
    assert.equal(resolved, result.entries[0].originalName);
  });

  it('createProviderSafeToolNameMap handles long tool names', () => {
    const longNameTool: MobigentHttpTool = {
      name: 'com_very_long_organization_name_with_many_segments_and_a_very_specific_tool_that_exceeds_the_maximum_allowed_length_for_provider_tool_names',
      description: 'A tool with a very long name.',
      inputSchema: { type: 'object', properties: {} },
    };

    const result = createProviderSafeToolNameMap([longNameTool]);

    assert.equal(result.entries.length, 1);
    assert.ok(
      result.entries[0].providerName.length <= 64,
      `Provider name "${result.entries[0].providerName}" should be ≤ 64 chars (actual: ${result.entries[0].providerName.length})`,
    );
  });
});

describe('tool call resolution', () => {
  it('resolveMobigentToolCall handles direct name in object', () => {
    const result = resolveMobigentToolCall({
      name: 'com_acme_expenses_create_expense',
      input: { amount: 42 },
    });

    assert.equal(result.name, 'com_acme_expenses_create_expense');
    assert.deepEqual(result.input, { amount: 42 });
  });

  it('resolveMobigentToolCall handles nested function.name pattern', () => {
    const result = resolveMobigentToolCall({
      id: 'call_abc123',
      function: {
        name: 'com_acme_expenses_read_expenses',
        arguments: JSON.stringify({ limit: 10 }),
      },
    });

    assert.equal(result.id, 'call_abc123');
    assert.equal(result.name, 'com_acme_expenses_read_expenses');
    assert.deepEqual(result.input, { limit: 10 });
  });

  it('resolveMobigentToolCall handles arguments as object', () => {
    const result = resolveMobigentToolCall({
      name: 'test_tool',
      arguments: { key: 'value' },
    });

    assert.equal(result.name, 'test_tool');
    assert.deepEqual(result.input, { key: 'value' });
  });

  it('resolveMobigentToolCall throws on missing name', () => {
    assert.throws(() => resolveMobigentToolCall({}), /missing a tool name/i);
  });
});

describe('tool call result formatting', () => {
  const successResult = {
    name: 'test_tool',
    input: { x: 1 },
    result: { ok: true },
  };

  const errorResult = {
    name: 'test_tool',
    input: { x: 1 },
    error: { message: 'Something went wrong.', code: 'INTERNAL_ERROR' },
  };

  it('formats as openai-responses output', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'openai-responses');
    assert.equal(formatted.type, 'function_call_output');
    assert.equal(formatted.call_id, 'test_tool');
    assert.ok(typeof formatted.output === 'string');
  });

  it('formats as chat-completions tool message', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'chat-completions');
    assert.equal(formatted.role, 'tool');
    assert.equal(formatted.tool_call_id, 'test_tool');
    assert.ok(typeof formatted.content === 'string');
  });

  it('formats as anthropic-tool-use result', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'anthropic-tool-use');
    assert.equal(formatted.type, 'tool_result');
    assert.equal(formatted.tool_use_id, 'test_tool');
    assert.ok(typeof formatted.content === 'string');

    // Error result sets is_error
    const errFormatted = formatMobigentToolCallResult(errorResult, 'anthropic-tool-use');
    assert.equal(errFormatted.is_error, true);
  });

  it('formats as google-gemini functionResponse', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'google-gemini');
    assert.ok('functionResponse' in formatted);
    assert.equal(formatted.functionResponse.name, 'test_tool');
  });

  it('formats as aws-bedrock-converse toolResult', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'aws-bedrock-converse');
    assert.ok('toolResult' in formatted);
    assert.equal(formatted.toolResult.status, 'success');

    const errFormatted = formatMobigentToolCallResult(errorResult, 'aws-bedrock-converse');
    assert.equal(errFormatted.toolResult.status, 'error');
  });

  it('falls back to raw result for generic-agent format', () => {
    const formatted = formatMobigentToolCallResult(successResult, 'generic-agent');
    assert.deepEqual(formatted, successResult);
  });
});
