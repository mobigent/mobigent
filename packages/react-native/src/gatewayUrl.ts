export type MobigentGatewayTarget = "localhost" | "ios-simulator" | "android-emulator" | "device";
export type MobigentGatewayPlatform = "ios" | "android" | "web" | "macos" | "windows" | string;

export type MobigentGatewayUrlOptions = {
  target?: MobigentGatewayTarget;
  host?: string;
  port?: number;
  secure?: boolean;
  path?: string;
};

export function createMobigentGatewayUrl(options: MobigentGatewayUrlOptions = {}) {
  const secure = options.secure ?? false;
  const protocol = secure ? "wss" : "ws";
  const host = options.host ?? hostForTarget(options.target ?? "localhost");
  const port = options.port ?? 8787;
  const path = normalizeGatewayPath(options.path);

  return `${protocol}://${host}:${port}${path}`;
}

export function createMobigentGatewayUrlForPlatform(
  platform: MobigentGatewayPlatform,
  options: Omit<MobigentGatewayUrlOptions, "target"> & {
    deviceHost?: string;
    androidTarget?: Extract<MobigentGatewayTarget, "android-emulator" | "device">;
  } = {}
) {
  if (options.deviceHost) {
    return createMobigentGatewayUrl({
      ...options,
      target: "device",
      host: options.host ?? options.deviceHost
    });
  }

  if (platform === "android") {
    return createMobigentGatewayUrl({
      ...options,
      target: options.androidTarget ?? "android-emulator"
    });
  }

  if (platform === "ios") {
    return createMobigentGatewayUrl({
      ...options,
      target: "ios-simulator"
    });
  }

  return createMobigentGatewayUrl(options);
}

function hostForTarget(target: MobigentGatewayTarget) {
  if (target === "android-emulator") {
    return "10.0.2.2";
  }

  return "localhost";
}

function normalizeGatewayPath(path: string | undefined) {
  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}
