# Mobigent Expense App Example

This example simulates a React Native expense app integrating `@mobigent/react-native`.

It registers:

- `create_expense`
- `delete_expense`
- `expenses` resource
- `expense.created` and `expense.deleted` events

## Run The Visible Demo

This is the best first demo because it shows the whole product in one browser page.

```bash
npm run demo:app
```

Click `Run agent request`. The request goes through the Mobigent gateway, calls the app-owned `create_expense` action, and adds a row to the visible app state.

If your system blocks auto-open, visit `http://localhost:8790`.

Open the gateway inspector at `http://localhost:8788/inspect` when you want to see the tools, session, call count, and audit trail.

## Run The Terminal Demo

```bash
npm run demo
```

## Run Gateway And App Separately

Terminal 1:

```bash
npm run dev:gateway
```

Terminal 2:

```bash
npm run dev:app
```

Then type commands into the gateway terminal:

```bash
tools
call com_mobigent_expenses.create_expense {"amount":28.5,"merchant":"Uber","category":"Travel"}
call com_mobigent_expenses.get_expenses {}
```
