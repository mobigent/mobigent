# React Native Integration

For normal app integration, use the simple API first:

- `@mobigent/react-native/simple`: declare app features with plain functions.
- `@mobigent/react-native/app`: wrap the existing app once.
- `@mobigent/react-native`: lower-level SDK, provider, hooks, and confirmation controller.

The lower-level APIs are still available, but most apps should start with `feature()` and `mobigentApp()`.

## Basic App Setup

Create one feature file:

```ts
import { feature } from "@mobigent/react-native/simple";

export const expenses = feature("expense")
  .read("list", async () => ({ items: await listExpenses() }))
  .write("create", async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number",
      notes: "string"
    },
    confirm: true
  });
```

Wrap the existing app once:

```tsx
import { mobigentApp } from "@mobigent/react-native/app";
import { expenses } from "./mobigent/expenses";

const { Root } = mobigentApp({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  features: [expenses]
});

export default function App() {
  return (
    <Root>
      <YourApp />
    </Root>
  );
}
```

Mobigent handles namespacing, schema generation, confirmation, connection lifecycle, reconnects, event queueing, and manifest updates.

## Lifecycle Cleanup

Simple app-level features normally do not need cleanup. If a screen owns a temporary capability, use the lower-level hook API and unregister it on unmount:

When a screen or hook owns a capability, clean it up on unmount:

```ts
useEffect(() => {
  bridge.registerComponent({
    name: "expense_detail",
    description: "Expense detail screen.",
    focus: async () => ({ focused: true })
  });

  return () => {
    bridge.unregisterComponent("expense_detail");
  };
}, [bridge]);
```

Available cleanup methods:

- `unregisterAction(name)`
- `unregisterResource(name)`
- `unregisterComponent(name)`

## Custom Confirmation UI

Use `useMobigentConfirmation()` if you want to build your own modal:

```tsx
import { Modal, Pressable, Text, View } from "react-native";
import { useMobigentConfirmation } from "@mobigent/react-native";

export function MyConfirmationModal() {
  const { request, approve, reject } = useMobigentConfirmation();

  return (
    <Modal visible={Boolean(request)} transparent>
      <View>
        <Text>{request?.action.confirmation?.title ?? "Approve action?"}</Text>
        <Text>{JSON.stringify(request?.input ?? {}, null, 2)}</Text>
        <Pressable onPress={reject}>
          <Text>Reject</Text>
        </Pressable>
        <Pressable onPress={approve}>
          <Text>Approve</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
```

## Transport

React Native provides `WebSocket` globally, so no transport setup is needed in a normal mobile app.

Node simulations, tests, and examples should inject a socket factory:

```ts
import WebSocket from "ws";
import { mobigent } from "@mobigent/react-native";

mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  createSocket: (url) => new WebSocket(url)
});
```

## Connection State And Reconnect

The provider exposes `connectionState` and `connected`:

```tsx
const { connectionState, connected, connect, disconnect } = useMobigent();
```

For app lifecycle resilience, enable reconnect:

```ts
mobigent.configure({
  appId: "com.example.expenses",
  appName: "Example Expenses",
  gatewayUrl: "ws://localhost:8787",
  reconnect: {
    enabled: true,
    maxAttempts: 20,
    delayMs: 1000
  }
});
```

State values:

- `idle`
- `connecting`
- `connected`
- `reconnecting`
- `disconnected`
- `error`
