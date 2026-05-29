import type { JsonObject, JsonSchema } from "@mobigent/core";
import {
  defineMobigentCapabilities,
  type MobigentActionHandler,
  type MobigentActionRegistration,
  type MobigentCapabilityKit,
  type MobigentComponentFocusHandler,
  type MobigentComponentRegistration,
  type MobigentRegistrationOptions,
  type MobigentResourceReader,
  type MobigentResourceRegistration
} from "./provider.js";
import { schema } from "./schema.js";

export type MobigentSimpleField =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | string[]
  | JsonSchema
  | MobigentSimpleObjectSchema
  | [JsonSchema | MobigentSimpleObjectSchema | "string" | "number" | "integer" | "boolean" | "object" | "array"];

export interface MobigentSimpleObjectSchema {
  [key: string]: MobigentSimpleField;
}

export type MobigentSimpleSchema = JsonSchema | MobigentSimpleObjectSchema;

export type MobigentSimpleActionOptions = {
  description?: string;
  input?: MobigentSimpleSchema;
  output?: MobigentSimpleSchema;
  confirm?: boolean | string;
  risk?: "low" | "medium" | "high";
};

export type MobigentSimpleResourceOptions = {
  description?: string;
  output?: MobigentSimpleSchema;
};

export type MobigentSimpleComponentOptions = {
  description?: string;
  props?: MobigentSimpleSchema;
};

export type MobigentSimpleFeature = MobigentCapabilityKit & {
  readonly namespace: string;
  action(name: string, handler: MobigentActionHandler, options?: MobigentSimpleActionOptions): MobigentSimpleFeature;
  write(name: string, handler: MobigentActionHandler, options?: MobigentSimpleActionOptions): MobigentSimpleFeature;
  resource(name: string, read: MobigentResourceReader, options?: MobigentSimpleResourceOptions): MobigentSimpleFeature;
  read(name: string, read: MobigentResourceReader, options?: MobigentSimpleResourceOptions): MobigentSimpleFeature;
  screen(
    name: string,
    focus: MobigentComponentFocusHandler,
    options?: MobigentSimpleComponentOptions
  ): MobigentSimpleFeature;
  capabilities(): MobigentCapabilityKit;
};

export function feature(namespace: string): MobigentSimpleFeature {
  const actions: MobigentActionRegistration[] = [];
  const resources: MobigentResourceRegistration[] = [];
  const components: MobigentComponentRegistration[] = [];

  const api: MobigentSimpleFeature = {
    namespace,
    actions,
    resources,
    components,
    action(name, handler, options = {}) {
      actions.push(toAction(namespace, name, handler, options));
      return api;
    },
    write(name, handler, options = {}) {
      return api.action(name, handler, { confirm: true, ...options });
    },
    resource(name, read, options = {}) {
      resources.push(toResource(namespace, name, read, options));
      return api;
    },
    read(name, read, options = {}) {
      return api.resource(name, read, options);
    },
    screen(name, focus, options = {}) {
      components.push(toComponent(namespace, name, focus, options));
      return api;
    },
    capabilities() {
      return defineMobigentCapabilities({ actions, resources, components });
    },
    useRegister(options: MobigentRegistrationOptions = {}) {
      return api.capabilities().useRegister(options);
    },
    Component(props: MobigentRegistrationOptions = {}) {
      return api.capabilities().Component(props);
    }
  };

  return api;
}

export const agentFeature = feature;

function toAction(
  namespace: string,
  name: string,
  handler: MobigentActionHandler,
  options: MobigentSimpleActionOptions
): MobigentActionRegistration {
  const confirmation = options.confirm
    ? {
        required: true,
        risk: options.risk ?? "medium",
        title: typeof options.confirm === "string" ? options.confirm : humanize(`${namespace} ${name}`)
      }
    : undefined;

  return {
    name: simpleCapabilityName(namespace, name),
    description: options.description ?? humanize(`${namespace} ${name}`),
    inputSchema: toSchema(options.input ?? {}),
    outputSchema: options.output ? toSchema(options.output) : undefined,
    confirmation,
    handler
  };
}

function toResource(
  namespace: string,
  name: string,
  read: MobigentResourceReader,
  options: MobigentSimpleResourceOptions
): MobigentResourceRegistration {
  return {
    name: simpleCapabilityName(namespace, name),
    description: options.description ?? humanize(`${namespace} ${name}`),
    outputSchema: options.output ? toSchema(options.output) : undefined,
    read
  };
}

function toComponent(
  namespace: string,
  name: string,
  focus: MobigentComponentFocusHandler,
  options: MobigentSimpleComponentOptions
): MobigentComponentRegistration {
  return {
    name: simpleCapabilityName(namespace, name),
    description: options.description ?? humanize(`${namespace} ${name}`),
    propsSchema: options.props ? toSchema(options.props) : undefined,
    focus
  };
}

export function toSchema(value: MobigentSimpleSchema): JsonSchema {
  if (isJsonSchema(value)) {
    return value;
  }

  return schema.object(
    Object.fromEntries(Object.entries(value).map(([key, field]) => [key, fieldToSchema(field)])),
    { required: "all" }
  );
}

export const simpleSchema = toSchema;

function fieldToSchema(field: MobigentSimpleField): JsonSchema {
  if (Array.isArray(field)) {
    if (field.length === 1 && typeof field[0] !== "string") {
      return schema.array(fieldToSchema(field[0]));
    }

    if (field.length === 1 && isSimpleType(field[0])) {
      return schema.array(fieldToSchema(field[0] as MobigentSimpleField));
    }

    return schema.enum(field.filter((value): value is string => typeof value === "string"));
  }

  if (typeof field === "string") {
    switch (field) {
      case "string":
        return schema.string();
      case "number":
        return schema.number();
      case "integer":
        return schema.integer();
      case "boolean":
        return schema.boolean();
      case "array":
        return schema.array(schema.object());
      case "object":
        return schema.object();
      default:
        return schema.string({ description: field });
    }
  }

  if (isJsonSchema(field)) {
    return field;
  }

  return toSchema(field);
}

function isJsonSchema(value: unknown): value is JsonSchema {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "type" in value &&
      typeof (value as JsonObject).type === "string"
  );
}

function isSimpleType(value: unknown): value is string {
  return ["string", "number", "integer", "boolean", "object", "array"].includes(String(value));
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function simpleCapabilityName(namespace: string, name: string) {
  const normalizedNamespace = namespace.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  const normalizedName = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");

  return `${normalizedNamespace}_${normalizedName}`.toLowerCase();
}
