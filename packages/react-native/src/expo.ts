import type {
  MobigentAppIdentity,
  MobigentEnvironmentMode
} from "./provider.js";
import type { MobigentGatewayPlatform } from "./gatewayUrl.js";

export type MobigentExpoPluginOptions = {
  app?: MobigentAppIdentity;
  appId?: string;
  appName?: string;
  version?: string;
  mode?: MobigentEnvironmentMode;
  host?: string;
  port?: number;
  secure?: boolean;
  path?: string;
  backendUrl?: string;
  gatewayUrl?: string;
  deviceHost?: string;
  platform?: MobigentGatewayPlatform;
  authToken?: string;
  enabled?: boolean;
};

export type MobigentExpoPluginConfig = {
  extra?: Record<string, unknown>;
};

export default function withMobigentExpoConfig<
  Config extends MobigentExpoPluginConfig
>(config: Config, options: MobigentExpoPluginOptions = {}): Config {
  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      mobigent: removeUndefinedFields({
        ...(isObject(config.extra?.mobigent) ? config.extra.mobigent : {}),
        app: options.app,
        appId: options.appId,
        appName: options.appName,
        version: options.version,
        mode: options.mode,
        host: options.host,
        port: options.port,
        secure: options.secure,
        path: options.path,
        backendUrl: options.backendUrl,
        gatewayUrl: options.gatewayUrl,
        deviceHost: options.deviceHost,
        platform: options.platform,
        authToken: options.authToken,
        enabled: options.enabled
      })
    }
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function removeUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
