import type { JsonSchema } from '@mobigent/core';

export type MobigentObjectSchemaShape = Record<string, JsonSchema>;

export type MobigentSchemaOptions = {
  description?: string;
};

export type MobigentObjectSchemaOptions = MobigentSchemaOptions & {
  required?: string[] | 'all';
};

export function stringSchema(options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'string' }, options);
}

export function numberSchema(options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'number' }, options);
}

export function integerSchema(options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'integer' }, options);
}

export function booleanSchema(options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'boolean' }, options);
}

export function nullSchema(options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'null' }, options);
}

export function enumSchema(values: string[], options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'string', enum: values }, options);
}

export function literalSchema(value: string, options: MobigentSchemaOptions = {}): JsonSchema {
  return enumSchema([value], options);
}

export function nullableSchema(value: JsonSchema, options: MobigentSchemaOptions = {}): JsonSchema {
  const type = Array.isArray(value.type) ? value.type : [value.type];
  const nullableType = type.includes('null') ? type : [...type, 'null'];

  return withDescription({ ...value, type: nullableType }, options);
}

export function arraySchema(items: JsonSchema, options: MobigentSchemaOptions = {}): JsonSchema {
  return withDescription({ type: 'array', items }, options);
}

export function objectSchema(
  properties: MobigentObjectSchemaShape = {},
  options: MobigentObjectSchemaOptions = {},
): JsonSchema {
  const required = options.required === 'all' ? Object.keys(properties) : options.required;

  return withDescription(
    {
      type: 'object',
      properties,
      ...(required && required.length > 0 ? { required } : {}),
    },
    options,
  );
}

export const schema = {
  string: stringSchema,
  number: numberSchema,
  integer: integerSchema,
  boolean: booleanSchema,
  null: nullSchema,
  enum: enumSchema,
  literal: literalSchema,
  nullable: nullableSchema,
  array: arraySchema,
  object: objectSchema,
};

function withDescription(schemaValue: JsonSchema, options: MobigentSchemaOptions) {
  return options.description ? { ...schemaValue, description: options.description } : schemaValue;
}
