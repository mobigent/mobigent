export type MobigentSocket = {
  readyState: number;
  send(data: string): void;
  close(): void;
  addEventListener?(event: 'open', listener: () => void): void;
  addEventListener?(event: 'error', listener: (event: unknown) => void): void;
  addEventListener?(event: 'message', listener: (event: { data: unknown }) => void): void;
  addEventListener?(event: 'close', listener: () => void): void;
  on?(event: 'open', listener: () => void): void;
  on?(event: 'error', listener: (event: unknown) => void): void;
  on?(event: 'message', listener: (data: unknown) => void): void;
  on?(event: 'close', listener: () => void): void;
  once?(event: 'open', listener: () => void): void;
  once?(event: 'error', listener: (event: unknown) => void): void;
};

export type MobigentSocketFactory = (url: string) => MobigentSocket;

type GlobalWithWebSocket = typeof globalThis & {
  WebSocket?: new (url: string) => MobigentSocket;
};

export const OPEN = 1;

export function createDefaultSocket(url: string): MobigentSocket {
  const WebSocketCtor = (globalThis as GlobalWithWebSocket).WebSocket;
  if (!WebSocketCtor) {
    throw new Error(
      'No global WebSocket implementation found. React Native provides one by default; Node tests should inject createSocket.',
    );
  }

  return new WebSocketCtor(url);
}

export function onceOpen(socket: MobigentSocket) {
  return new Promise<void>((resolve, reject) => {
    if (socket.addEventListener) {
      socket.addEventListener('open', resolve);
      socket.addEventListener('error', reject);
      return;
    }

    if (socket.once) {
      socket.once('open', resolve);
      socket.once('error', reject);
      return;
    }

    if (socket.on) {
      socket.on('open', resolve);
      socket.on('error', reject);
      return;
    }

    reject(new Error('WebSocket implementation does not support event listeners.'));
  });
}

export function onMessage(socket: MobigentSocket, listener: (message: string) => void) {
  if (socket.addEventListener) {
    socket.addEventListener('message', (event) => {
      listener(readMessageData(event.data));
    });
    return;
  }

  if (socket.on) {
    socket.on('message', (data) => {
      listener(readMessageData(data));
    });
  }
}

export function onClose(socket: MobigentSocket, listener: () => void) {
  if (socket.addEventListener) {
    socket.addEventListener('close', listener);
    return;
  }

  if (socket.on) {
    socket.on('close', listener);
  }
}

export function onError(socket: MobigentSocket, listener: (error: unknown) => void) {
  if (socket.addEventListener) {
    socket.addEventListener('error', listener);
    return;
  }

  if (socket.on) {
    socket.on('error', listener);
  }
}

function readMessageData(data: unknown) {
  if (typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }

  return String(data);
}
