# Mobigent iOS Expense Example

Run the gateway first:

```bash
npm run dev:http
```

Then run the example:

```bash
cd examples/ios-expense
swift run
```

The example exposes:

- `expense.create`: confirmed write app function
- `expense.list`: read-only app function
