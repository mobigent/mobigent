import type { ActionDefinition, JsonObject } from '@mobigent/core';

export type ConfirmationRequest = {
  id: string;
  action: ActionDefinition;
  input: JsonObject;
  resolve(approved: boolean): void;
};

export type ConfirmationListener = (request: ConfirmationRequest | undefined) => void;

export class ConfirmationController {
  private current?: ConfirmationRequest;
  private listeners = new Set<ConfirmationListener>();

  request(action: ActionDefinition, input: JsonObject) {
    if (this.current) {
      this.current.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      this.current = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        action,
        input,
        resolve,
      };
      this.notify();
    });
  }

  approve() {
    this.complete(true);
  }

  reject() {
    this.complete(false);
  }

  getCurrent() {
    return this.current;
  }

  subscribe(listener: ConfirmationListener) {
    this.listeners.add(listener);
    listener(this.current);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private complete(approved: boolean) {
    const request = this.current;
    if (!request) {
      return;
    }

    this.current = undefined;
    request.resolve(approved);
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}

export function createConfirmationController() {
  return new ConfirmationController();
}
