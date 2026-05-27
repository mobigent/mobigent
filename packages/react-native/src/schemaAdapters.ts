import { z } from "zod";
import type { JsonSchema } from "@mobigent/core";

export type MobigentSchemaAdapterOptions = {
  description?: string;
};

export function fromJsonSchema(schema: JsonSchema, options: MobigentSchemaAdapterOptions = {}): JsonSchema {
  return normalizeJsonSchema({ ...schema, ...(options.description ? { description: options.description } : {}) });
}

export function fromTypeBox(schema: JsonSchema, options: MobigentSchemaAdapterOptions = {}): JsonSchema {
  return fromJsonSchema(schema, options);
}

export function fromZod(schema: z.ZodType, options: MobigentSchemaAdapterOptions = {}): JsonSchema {
  const jsonSchema = z.toJSONSchema(schema) as JsonSchema;
  return fromJsonSchema(jsonSchema, options);
}

export const schemaAdapters = {
  json: fromJsonSchema,
  typebox: fromTypeBox,
  zod: fromZod
} as const;

function normalizeJsonSchema(schema: JsonSchema): JsonSchema {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error("Mobigent schema adapters must receive a JSON Schema object.");
  }

  const { $schema: _schemaVersion, ...normalized } = schema as JsonSchema & { $schema?: string };
  return normalized;
}
