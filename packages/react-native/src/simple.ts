import type { JsonObject, JsonSchema } from "@mobigent/core";
import type {
  MobigentActionHandler,
  MobigentActionRegistration,
  MobigentComponentFocusHandler,
  MobigentComponentRegistration,
  MobigentResourceReader,
  MobigentResourceRegistration
} from "./provider.js";
import type {
  MobigentEventQueueOptions,
  MobigentHeartbeatOptions,
  MobigentManifestSigner,
  MobigentReconnectOptions
} from "./AgentBridge.js";
import { mobigent } from "./AgentBridge.js";
import {
  createMobigentGatewayUrl,
  createMobigentGatewayUrlForPlatform,
  type MobigentGatewayPlatform,
  type MobigentGatewayTarget
} from "./gatewayUrl.js";
import { schema } from "./schema.js";
import type { MobigentSocketFactory } from "./transport.js";

const defaultMobigentSimpleAppIdentity = {
  id: "app.mobigent.local",
  name: "Mobigent App"
};

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

export type MobigentSimpleCapabilities = {
  actions: MobigentActionRegistration[];
  resources: MobigentResourceRegistration[];
  components: MobigentComponentRegistration[];
};

export type MobigentSimpleFeature = MobigentSimpleCapabilities & {
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
  capabilities(): MobigentSimpleCapabilities;
};

export type MobigentSimpleCapabilityDefinition =
  | {
      kind: "action";
      handler: MobigentActionHandler;
      options?: MobigentSimpleActionOptions;
    }
  | {
      kind: "resource";
      read: MobigentResourceReader;
      options?: MobigentSimpleResourceOptions;
    }
  | {
      kind: "component";
      focus: MobigentComponentFocusHandler;
      options?: MobigentSimpleComponentOptions;
    };

export type MobigentSimpleFunction = MobigentActionHandler | MobigentSimpleCapabilityDefinition;
export type MobigentSimpleCapabilityMap = Record<string, MobigentSimpleFunction>;
export type MobigentSimpleFeatureMap = Record<string, MobigentSimpleCapabilityMap>;
export type MobigentSimpleFunctionMap = MobigentSimpleFeatureMap;

export type MobigentSimpleClient = {
  registerAction(action: MobigentActionRegistration): unknown;
  registerResource(resource: MobigentResourceRegistration): unknown;
  registerComponent(component: MobigentComponentRegistration): unknown;
  unregisterAction?(name: string): unknown;
  unregisterResource?(name: string): unknown;
  unregisterComponent?(name: string): unknown;
};

export type MobigentSimpleBackendConnection =
  | string
  | {
      host?: string;
      deviceHost?: string;
      port?: number;
      secure?: boolean;
      path?: string;
      target?: MobigentGatewayTarget;
      platform?: MobigentGatewayPlatform;
    };

export type MobigentSimpleConnectionOptions = {
  appId?: string;
  appName?: string;
  connection?: MobigentSimpleBackendConnection;
  connectionUrl?: string;
  gatewayUrl?: string;
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
  "appId" | "appName" | "connection" | "connectionUrl" | "gatewayUrl" | "version" | "authToken"
> & {
  appId: string;
  appName: string;
};

export function defineMobigentConfig(config: MobigentSimpleAppConfig): MobigentSimpleAppConfig {
  return config;
}

export type MobigentSimpleConfiguredConnectionOptions = Omit<
  MobigentSimpleConnectionOptions,
  "appId" | "appName" | "connection" | "connectionUrl" | "gatewayUrl" | "version" | "authToken"
> & {
  config: MobigentSimpleAppConfig;
  appId?: string;
  appName?: string;
  connection?: MobigentSimpleBackendConnection;
  connectionUrl?: string;
  gatewayUrl?: string;
  version?: string;
  authToken?: string;
};

export type MobigentSimpleConnectionSettings =
  | Omit<MobigentSimpleConnectionOptions, "features">
  | Omit<MobigentSimpleConfiguredConnectionOptions, "features">;

export type MobigentSimpleConnectionClient = MobigentSimpleClient & {
  configure(options: Omit<MobigentSimpleConnectionOptions, "features">): unknown;
  connect(): Promise<void>;
  disconnect(): unknown;
};

export type MobigentResolvedConnectionOptions = Omit<
  MobigentSimpleConnectionOptions,
  "appId" | "appName" | "gatewayUrl"
> & {
  appId: string;
  appName: string;
  gatewayUrl: string;
};

export type MobigentSimpleConnection = {
  disconnect(): void;
};

export function emitMobigentEvent(name: string, payload: JsonObject = {}) {
  return mobigent.emit(name, payload);
}

export function read(read: MobigentResourceReader, options?: MobigentSimpleResourceOptions): MobigentSimpleCapabilityDefinition {
  return {
    kind: "resource",
    read,
    options
  };
}

export function action(
  handler: MobigentActionHandler,
  options?: MobigentSimpleActionOptions
): MobigentSimpleCapabilityDefinition {
  return {
    kind: "action",
    handler,
    options
  };
}

export function write(
  handler: MobigentActionHandler,
  options?: MobigentSimpleActionOptions
): MobigentSimpleCapabilityDefinition {
  return action(handler, { confirm: true, ...options });
}

export function screen(
  focus: MobigentComponentFocusHandler,
  options?: MobigentSimpleComponentOptions
): MobigentSimpleCapabilityDefinition {
  return {
    kind: "component",
    focus,
    options
  };
}

export function defineMobigent(features: MobigentSimpleFeatureMap): MobigentSimpleFeature[] {
  return Object.entries(features).map(([namespace, capabilities]) => feature(namespace, capabilities));
}

export const defineFunctions = defineMobigent;
export const functions = defineMobigent;

export function feature(namespace: string, capabilities?: MobigentSimpleCapabilityMap): MobigentSimpleFeature {
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
      return { actions, resources, components };
    }
  };

  if (capabilities) {
    addCapabilities(api, capabilities);
  }

  return api;
}

export const agentFeature = feature;
export const defineFeature = feature;
export const createFeature = feature;

function addCapabilities(api: MobigentSimpleFeature, capabilities: MobigentSimpleCapabilityMap) {
  for (const [name, capability] of Object.entries(capabilities)) {
    if (typeof capability === "function") {
      addPlainFunction(api, name, capability);
      continue;
    }

    switch (capability.kind) {
      case "action":
        api.action(name, capability.handler, capability.options);
        break;
      case "resource":
        api.resource(name, capability.read, capability.options);
        break;
      case "component":
        api.screen(name, capability.focus, capability.options);
        break;
    }
  }
}

function addPlainFunction(api: MobigentSimpleFeature, name: string, handler: MobigentActionHandler) {
  if (isReadFunctionName(name)) {
    api.resource(name, async () => handler({}));
    return;
  }

  api.action(name, handler, { confirm: true });
}

function isReadFunctionName(name: string) {
  return /^(list|get|read|fetch|search|load)([A-Z_.-]|$)/.test(name);
}

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
): Promise<MobigentSimpleConnection>;
export async function connectMobigent(
  client: MobigentSimpleConnectionClient,
  features: MobigentSimpleFeature | MobigentSimpleFeature[],
  options?: MobigentSimpleConnectionSettings
): Promise<MobigentSimpleConnection>;
export async function connectMobigent(
  options: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
): Promise<MobigentSimpleConnection>;
export async function connectMobigent(
  features: MobigentSimpleFeature | MobigentSimpleFeature[],
  options?: MobigentSimpleConnectionSettings
): Promise<MobigentSimpleConnection>;
export async function connectMobigent(
  clientOrOptions:
    | MobigentSimpleConnectionClient
    | MobigentSimpleConnectionOptions
    | MobigentSimpleConfiguredConnectionOptions
    | MobigentSimpleFeature
    | MobigentSimpleFeature[],
  maybeOptions?: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions | MobigentSimpleConnectionSettings | MobigentSimpleFeature | MobigentSimpleFeature[],
  maybeSettings?: MobigentSimpleConnectionSettings
): Promise<MobigentSimpleConnection> {
  const parsed = parseConnectArgs(clientOrOptions, maybeOptions, maybeSettings);
  const { client, options } = parsed;
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

function parseConnectArgs(
  clientOrOptions:
    | MobigentSimpleConnectionClient
    | MobigentSimpleConnectionOptions
    | MobigentSimpleConfiguredConnectionOptions
    | MobigentSimpleFeature
    | MobigentSimpleFeature[],
  maybeOptions?: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions | MobigentSimpleConnectionSettings | MobigentSimpleFeature | MobigentSimpleFeature[],
  maybeSettings?: MobigentSimpleConnectionSettings
): {
  client: MobigentSimpleConnectionClient;
  options: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions;
} {
  if (isMobigentSimpleClient(clientOrOptions)) {
    const client = clientOrOptions;

    if (isMobigentFeatureInput(maybeOptions)) {
      return {
        client,
        options: {
          ...(maybeSettings ?? {}),
          features: maybeOptions
        } as MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
      };
    }

    return {
      client,
      options: maybeOptions as MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
    };
  }

  if (isMobigentFeatureInput(clientOrOptions)) {
    return {
      client: mobigent as unknown as MobigentSimpleConnectionClient,
      options: {
        ...((maybeOptions as MobigentSimpleConnectionSettings | undefined) ?? {}),
        features: clientOrOptions
      } as MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
    };
  }

  return {
    client: mobigent as unknown as MobigentSimpleConnectionClient,
    options: clientOrOptions
  };
}

function isMobigentSimpleClient(value: unknown): value is MobigentSimpleConnectionClient {
  return Boolean(
    value &&
      typeof value === "object" &&
      "configure" in value &&
      "connect" in value &&
      "disconnect" in value &&
      "registerAction" in value
  );
}

function isMobigentFeatureInput(value: unknown): value is MobigentSimpleFeature | MobigentSimpleFeature[] {
  if (Array.isArray(value)) {
    return value.every(isMobigentFeature);
  }

  return isMobigentFeature(value);
}

function isMobigentFeature(value: unknown): value is MobigentSimpleFeature {
  return Boolean(
    value &&
      typeof value === "object" &&
      "namespace" in value &&
      "actions" in value &&
      "resources" in value &&
      "components" in value
  );
}

function resolveConnectionOptions(
  options: MobigentSimpleConnectionOptions | MobigentSimpleConfiguredConnectionOptions
): MobigentResolvedConnectionOptions {
  if (!("config" in options)) {
    return {
      ...options,
      appId: options.appId ?? defaultMobigentSimpleAppIdentity.id,
      appName: options.appName ?? defaultMobigentSimpleAppIdentity.name,
      gatewayUrl:
        options.gatewayUrl ??
        options.connectionUrl ??
        resolveMobigentConnectionUrl(options.connection) ??
        createMobigentGatewayUrl()
    };
  }

  const { config, ...rest } = options;
  const appId = rest.appId ?? config.appId ?? defaultMobigentSimpleAppIdentity.id;
  const appName = rest.appName ?? config.appName ?? defaultMobigentSimpleAppIdentity.name;

  return {
    ...rest,
    appId,
    appName,
    gatewayUrl:
      rest.gatewayUrl ??
      rest.connectionUrl ??
      resolveMobigentConnectionUrl(rest.connection) ??
      config.gatewayUrl ??
      config.connectionUrl ??
      resolveMobigentConnectionUrl(config.connection) ??
      createMobigentGatewayUrl(),
    version: rest.version ?? config.version,
    authToken: rest.authToken ?? config.authToken
  };
}

export function resolveMobigentConnectionUrl(connection?: MobigentSimpleBackendConnection): string | undefined {
  if (!connection) {
    return undefined;
  }

  if (typeof connection === "string") {
    return connection;
  }

  const host = connection.host ?? connection.deviceHost;
  const options = {
    ...connection,
    host,
    target: connection.target ?? (connection.deviceHost ? "device" : undefined)
  };

  return connection.platform
    ? createMobigentGatewayUrlForPlatform(connection.platform, options)
    : createMobigentGatewayUrl(options);
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
