# Mobigent Android Expense Example

Run the gateway first:

```bash
npm run dev:http
```

Then open `examples/android-expense` in Android Studio or run with a local Gradle installation:

```bash
cd examples/android-expense
gradle :app:installDebug
```

The Android emulator uses `ws://10.0.2.2:8787` to reach the host gateway.
