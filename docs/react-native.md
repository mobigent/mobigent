# React Native Integration

Mobigent has two React Native layers:

- `@mobigent/react-native`: headless SDK, provider, hooks, confirmation controller.
- `@mobigent/react-native/ui`: optional default React Native confirmation modal.

The root package is safe to import in tests and Node-based tooling because it does not load `react-native` UI components.

## Basic App Setup

```tsx
import { MobigentProvider, useMobigent } from "@mobigent/react-native";
import { MobigentConfirmationModal } from "@mobigent/react-native/ui";

function Capabilities() {
  const { bridge } = useMobigent();

  useEffect(() => {
    bridge.registerAction({
      name: "create_expense",
      description: "Create a new expense report.",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number" },
          merchant: { type: "string" }
        },
        required: ["amount", "merchant"]
      },
      confirmation: {
        required: true,
        title: "Create expense?",
        risk: "medium"
      },
      handler: async (input) => {
        return createExpense(input);
      }
    });

    bridge.registerComponent({
      name: "expense_detail",
      description: "Expense detail screen.",
      propsSchema: {
        type: "object",
        properties: {
          expenseId: { type: "string" }
        },
        required: ["expenseId"]
      },
      focus: async (props) => {
        navigation.navigate("ExpenseDetail", { expenseId: props.expenseId });
        return { focused: true };
      }
    });
  }, [bridge]);

  return null;
}

export function App() {
  return (
    <MobigentProvider
      appId="com.example.expenses"
      appName="Example Expenses"
      gatewayUrl="ws://localhost:8787"
      authToken="dev-secret"
    >
      <Capabilities />
      <MobigentConfirmationModal />
      <YourApp />
    </MobigentProvider>
  );
}
```

## Lifecycle Cleanup

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
