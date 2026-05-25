# Mobigent Expense App Example

This example simulates a React Native expense app integrating `@mobigent/react-native`.

It registers:

- `create_expense`
- `delete_expense`
- `expenses` resource
- `expense.created` and `expense.deleted` events

## Run The Local Demo

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
