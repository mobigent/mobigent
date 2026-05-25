import WebSocket from "ws";
import type { MobigentSocketFactory } from "@mobigent/react-native";

export const createNodeSocket: MobigentSocketFactory = (url) => new WebSocket(url);
