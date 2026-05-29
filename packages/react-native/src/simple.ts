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
import type {
  MobigentEventQueueOptions,
  MobigentHeartbeatOptions,
  MobigentManifestSigner,
  MobigentReconnectOptions
} from "./AgentBridge.js";
import { schema } from "./schema.js";
import type { MobigentSocketFactory } from "./transport.js";

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

export type MobigentSimpleClient = {
  registerAction(action: MobigentActionRegistration): unknown;
  registerResource(resource: MobigentResourceRegistration): unknown;
  registerComponent(component: MobigentComponentRegistration): unknown;
  unregisterAction?(name: string): unknown;
  unregisterResource?(name: string): unknown;
  unregisterComponent?(name: string): unknown;
};

export type MobigentSimpleConnectionOptions = {
  appId: string;
  appName: string;
  gatewayUrl: string;
  features: MobigentSimpleFeature | MobigentSimpleFeature[];
  version?: string;
  authToken?: string;
  confirm?: (request: { action: unknown; input: JsonObject }) => Promise<boolean> | boolean;
  signManifest?: MobigentManifestSigner;
  createSocket?: MobigentSocketFactory;
  reconnect?: boolean | MobigentReconnectOptions;
  eventQueue?: boolean | MobigentEventQueueOptions;
  heartbeat?: boolean | MobigentHeartbeatOptions;
};

export type MobigentSimpleAppConfig = Pick<
  MobigentSimpleConnectionOptions,
  "appId" | "appName" | "gatewayUrl" | "version" | "authToken"
>;

export function defineMobigentConfig(config: MobigentSimpleAppConfig): MobigentSimpleAppConfig {
  return config;
}

export type MobigentSimpleConfiguredConnectionOptions = Omit<
  MobigentSimpleConnectionOptions,
  "appId" | "appName" | "gatewayUrl" | "version" | "authToken"
> & {
  config: MobigentSimpleAppConfig;
  appId?: string;
  appName?: string;
  gatewayUrl?: string;
  version?: string;
  authToken?: string;
};

export type MobigentSimpleConnectionClient = MobigentSimpleClient & {
  configure(options: Omit<MobigentSimpleConnectionOptions, "features">): unknown;
  connect(): Promise<void>;
  disconnect(): unknown;
};

export type MobigentSimpleConnection = {
  disconnect(): void;
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

export function registerFeatures(
  client: MobigentSimpleClient,
  features: MobigentSimpleFeature | MobigentSimpleFeature[]
): () => void {
  const featureList = Array.isArray(features) ? features : [features];
  const registeredActions: MobigentActionRegistration[] = [];
  const registeredResources: MobigentResourceRegistration[] = [];
  const registeredComponents: MobigentComponentRegistration[] = [];

  for (const item of featureList) {
    for (const action of item.actions) {
      client.registerAction(action);
      registeredActions.push(action);
    }

    for (const resource of item.resources) {
      client.registerResource(resource);
      registeredResources.push(resource);
    }

    for (const component of item.components) {
      client.registerComponent(component);
      registeredComponents.push(component);
    }
  }

  return () => {
    for (const component of [...registeredComponents].reverse()) {
      client.unregisterComponent?.(component.name);
    }

    for (const resource of [...registeredResources].reverse()) {
      client.unregisterResource?.(resource.name);
    }

    for (const action of [...registeredActions].reverse()) {
      client.unregisterAction?.(action.name);
    }
  };
}

export const registerFeature = registerFeatures;

export async function connectMobigent(
  client: MobigentSimpleConnectionClient,
  options: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
): Promise<MobigentSimpleConnection> {
  const { features, ...connectionOptions } = resolveConnectionOptions(options);

  client.configure(connectionOptions);
  const unregisterFeatures = registerFeatures(client, features);

  try {
    await client.connect();
  } catch (error) {
    unregisterFeatures();
    throw error;
  }

  return {
    disconnect() {
      unregisterFeatures();
      client.disconnect();
    }
  };
}

function resolveConnectionOptions(
  options: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
): MobigentSimpleConnectionOptions {
  if (!("config" in options)) {
    return options;
  }

  const { config, ...rest } = options;

  return {
    ...rest,
    appId: rest.appId ?? config.appId,
    appName: rest.appName ?? config.appName,
    gatewayUrl: rest.gatewayUrl ?? config.gatewayUrl,
    version: rest.version ?? config.version,
    authToken: rest.authToken ?? config.authToken
  };
}

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
