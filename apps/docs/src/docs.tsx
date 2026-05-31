import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Github,
  KeyRound,
  Lock,
  Network,
  Rocket,
  ShieldCheck,
  Smartphone,
  Terminal,
  Workflow
} from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const quickstart = `# backend
cd backend
npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app

# app
cd ../mobile-app
npm install @mobigent/app
npx mobigent-init --feature expense --out-dir src`;

const customLayoutCode = `# app in a custom folder layout
npx mobigent-init \\
  --feature expense \\
  --out-dir src \\
  --backend-dir ../server`;

const demoCode = `npm exec --yes \\
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.12/create-mobigent-app-0.1.12.tgz \\
  -- create-mobigent-app my-demo --install
cd my-demo
npm run dev

# in another terminal
npm run doctor
npm run agent:local`;

const repoDemoCode = `npm install
npm run demo:app

open http://localhost:8788/inspect`;

const localStarterCode = `npm run starter:new -- my-demo --install
cd my-demo
npm run dev

# in another terminal
npm run doctor
npm run agent:local`;

const moduleCode = `import { defineFeature, read, write } from "@mobigent/app";

export const expenses = defineFeature("expense", {
  list: read(async () => ({
    items: await listExpenses()
  })),
  create: write(async (input) => createExpense(input), {
    input: {
      merchant: "string",
      amount: "number"
    },
    confirm: true
  })
});`;

const appCode = `import { withMobigent } from "@mobigent/app";
import { expenses } from "./mobigent/expense";
import App from "./App";

export default withMobigent(App, expenses);`;

const gatewayCode = `npx mobigent-http

curl http://localhost:8788/health
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json
open http://localhost:8788/inspect

npx mobigent-mcp`;

const backendCode = `import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent({
  appDir: "../mobile-app"
});
await mobigent.waitForApp();

const app = mobigent.appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Airport Taxi", amount: 42.25 });
await app.listExpenses();

console.log(mobigent.urls.inspector);`;

const backendHelperCode = `import { appFunctions, waitForApp } from "./mobigent";

await waitForApp();

const app = appFunctions({
  createExpense: "expense.create",
  listExpenses: "expense.list"
});

await app.createExpense({ merchant: "Coffee", amount: 8 });
await app.listExpenses();`;

const backendInitCode = `npm install @mobigent/backend
npx mobigent-backend --app-dir ../mobile-app`;

const securityDoctorCode = `npx mobigent security-doctor \\
  --app-id com.example.app \\
  --app-name "Example App" \\
  --feature expense \\
  --gateway-url wss://gateway.example.com \\
  --custom-confirmation`;

const schemaAdapterCode = `import { fromZod, fromTypeBox } from "@mobigent/app";
import { z } from "zod";

const expenseInput = fromZod(z.object({
  merchant: z.string(),
  amount: z.number()
}));

const taskInput = fromTypeBox({
  type: "object",
  properties: { title: { type: "string" } },
  required: ["title"]
});`;

const platformActionsCode = `npx mobigent-init \\
  --platform-actions json \\
  --app-id com.example.app \\
  --app-name "Example App" \\
  --feature expense

npx mobigent-init --platform-actions ios-swift ...
npx mobigent-init --platform-actions android-xml ...`;

const providerCode = `import { createChatGptActionsProvider } from "@mobigent/providers";

createChatGptActionsProvider({
  baseUrl: "https://your-gateway.example.com",
  auth: "bearer"
});`;

const iosInstallCode = `// Package.swift
dependencies: [
  .package(path: "../mobigent/packages/ios")
],
targets: [
  .target(
    name: "YourApp",
    dependencies: [
      .product(name: "Mobigent", package: "ios")
    ]
  )
]`;

const iosUsageCode = `import Mobigent

let client = MobigentClient(
  appId: "com.example.expense",
  appName: "Expense App",
  gatewayURL: URL(string: "ws://localhost:8787")!,
  version: "1.0.0"
)

client.registerResource(MobigentResource(
  name: "expense.list",
  description: "Read saved expenses.",
  outputSchema: .object([
    "items": .array(.object([
      "merchant": .string(),
      "amount": .number()
    ]))
  ]),
  handler: { _ in ["items": listExpenses()] }
))

client.registerAction(MobigentAction(
  name: "expense.create",
  description: "Create an expense after approval.",
  inputSchema: .object([
    "merchant": .string(),
    "amount": .number()
  ], required: ["merchant", "amount"]),
  confirmation: .required(risk: "medium"),
  handler: { input in createExpense(input) }
))

client.onConfirmation { request in
  await showApprovalSheet(request)
}

try await client.connect()`;

const androidInstallCode = `// settings.gradle.kts
dependencyResolutionManagement {
  repositories {
    google()
    mavenCentral()
  }
}

include(":mobigent-android")
project(":mobigent-android").projectDir =
  file("../mobigent/packages/android")

// app/build.gradle.kts
dependencies {
  implementation(project(":mobigent-android"))
}`;

const androidUsageCode = `import io.mobigent.MobigentAction
import io.mobigent.MobigentClient
import io.mobigent.MobigentConfirmationPolicy
import io.mobigent.MobigentResource
import io.mobigent.MobigentRisk
import io.mobigent.MobigentSchema

val client = MobigentClient.Builder(context)
  .appId("com.example.expense")
  .appName("Expense App")
  .gatewayUrl("ws://10.0.2.2:8787")
  .version("1.0.0")
  .build()

client.registerResource(
  MobigentResource(
    name = "expense.list",
    description = "Read saved expenses.",
    outputSchema = MobigentSchema.obj(
      mapOf("items" to MobigentSchema.array(
        MobigentSchema.obj(
          mapOf(
            "merchant" to MobigentSchema.string(),
            "amount" to MobigentSchema.number()
          )
        )
      ))
    )
  ) { mapOf("items" to listExpenses()) }
)

client.registerAction(
  MobigentAction(
    name = "expense.create",
    description = "Create an expense after approval.",
    inputSchema = MobigentSchema.obj(
      mapOf(
        "merchant" to MobigentSchema.string(),
        "amount" to MobigentSchema.number()
      ),
      required = listOf("merchant", "amount")
    ),
    confirmation = MobigentConfirmationPolicy(
      required = true,
      risk = MobigentRisk.Medium
    )
  ) { input -> createExpense(input) }
)

client.confirmationHandler { request ->
  showApprovalDialog(request)
}

client.connect()`;

const nativeLifecycle = [
  ["1. Create a client", "Give Mobigent the app id, app name, version, and backend connection URL."],
  ["2. Register capabilities", "Add actions for writes, resources for reads, and components for screen context."],
  ["3. Add confirmations", "Mark risky actions and let the native app render the approval UI."],
  ["4. Connect", "The SDK connects to the backend and exposes the registered functions."],
  ["5. Emit events", "Send app events such as expense.created or sync.failed back to the agent."]
];

const nativeUrls = [
  ["iOS simulator", "ws://localhost:8787"],
  ["Android emulator", "ws://10.0.2.2:8787"],
  ["Physical device", "ws://YOUR_MAC_LAN_IP:8787"],
  ["Hosted gateway", "wss://your-gateway.example.com"]
];

const firstRunChecks = [
  ["Install", "Add the app package to React Native and the backend package to your server."],
  ["Expose", "`defineFeature()` turns real app functions into typed agent capabilities."],
  ["Connect", "The app initializer finds `mobigent.app.json` from the app, parent folders, common sibling backend folders, or `--backend-dir`."],
  ["Wait", "`waitForApp()` tells backend code when the app is connected and callable."],
  ["Approve", "Risky actions pause inside the app before handlers run."],
  ["Audit", "Calls, approvals, denials, errors, and events appear in `/audit`."]
];

const model = [
  ["App package", "Lives inside the mobile app and exposes real app functions."],
  ["Backend package", "Runs the bridge, waits for the app, and gives agents a clean callable API."],
  ["Agent", "Calls typed functions and receives typed results instead of touching the UI."],
  ["User", "Approves risky actions inside the app before handlers run."]
];

const capabilities = [
  ["Actions", "Write or command operations", "create expense, submit order, update profile"],
  ["Resources", "Read-only app data", "list expenses, get active workspace, read cart"],
  ["Surfaces", "Screen-aware context", "current route, focused record, visible component"],
  ["Events", "App-to-agent signals", "expense.created, sync.failed, user.selected"],
  ["Confirmations", "User approval gates", "medium or high risk writes"]
];

const packages = [
  ["mobigent", "Friendly CLI", "One command for starters, app feature setup, backend setup, and agent setup."],
  ["create-mobigent-app", "Starter generator", "Creates a runnable app with backend, inspector, visible state, and an agent playground."],
  ["@mobigent/app", "App-side SDK", "Expo/React Native roots, modules, hooks, UI helpers, confirmation flow."],
  ["@mobigent/backend", "Backend SDK", "One function starts the backend, exposes agent setup, waits for app readiness, and routes calls."],
  ["Mobigent iOS", "Swift package", "Native iOS client with actions, resources, components, confirmations, reconnect, heartbeat, and events."],
  ["Mobigent Android", "Kotlin library", "Native Android client with the same gateway protocol and local emulator-friendly defaults."],
  ["@mobigent/gateway", "Advanced internals", "Lower-level WebSocket app sessions, HTTP API, OpenAPI schema, and MCP server."],
  ["@mobigent/providers", "Advanced internals", "Provider descriptors and runtime helpers behind the backend SDK."],
  ["@mobigent/core", "Advanced internals", "Shared types, protocol messages, schemas, and validation contracts."]
];

const reactNativeApis = [
  ["defineFeature()", "Creates a small feature surface with read, write, and screen helpers."],
  ["defineMobigentConfig()", "Keeps copied app config typed and portable."],
  ["withMobigent()", "Wraps the existing React Native app in one normal function call."],
  ["mobigentApp()", "Returns an explicit Root provider when you prefer JSX wrapping."],
  ["connectMobigent()", "Consumes backend app config, registers features, and connects a non-React host in one call."],
  ["emitMobigentEvent()", "Queues or sends app events without touching the lower-level client."],
  ["registerFeatures()", "Attaches features manually when you need custom lifecycle control."],
  ["read()", "Exposes read-only app data to agents."],
  ["write()", "Exposes a confirmed app action with plain input fields."],
  ["useAgentScreen()", "Makes screen-owned capabilities available only while the screen is mounted."],
  ["useMobigentStatus()", "Reads connection state for badges, diagnostics, and debugging."],
  ["MobigentStatusBadge", "Optional UI component for local development visibility."]
];

const nativeApis = [
  ["iOS MobigentClient", "Swift client for registering capabilities, connecting, emitting events, and reading diagnostics."],
  ["Android MobigentClient.Builder", "Kotlin builder for app identity, connection URL, reconnect, heartbeat, and transport setup."],
  ["MobigentSchema", "Shared native schema builders for string, number, boolean, object, array, and enum."],
  ["confirmation handler", "Native callback hook so the host app renders its own approval UI."]
];

const backendApis = [
  ["startMobigent()", "Starts the backend service and writes app config when `appDir` is provided."],
  ["waitForApp()", "Waits until the app is connected and has exposed at least one function."],
  ["appFunctions()", "Creates a small object of normal backend functions from app-owned function names."],
  ["callApp()", "Makes a quick one-off app function call by name."],
  ["appFunction()", "Creates a reusable backend function wrapper for repeated calls."],
  ["agent()", "Prints setup for ChatGPT, Claude, OpenAPI, and supported providers after the app loop works."]
];

const gatewayEndpoints = [
  ["GET /health", "Liveness, session counts, tool counts, and operational status."],
  ["GET /ready", "Readiness check for deployments and agent startup."],
  ["GET /tools", "Provider-facing discovery generated from your app functions."],
  ["POST /tools/{name}/call", "Call a mobile capability with validated JSON input."],
  ["GET /openapi.json", "Importable OpenAPI schema for ChatGPT Actions and HTTP agents."],
  ["GET /providers", "Provider setup descriptors for supported agent platforms."],
  ["GET /audit", "Recent audit events for tool calls, approvals, and failures."],
  ["GET /metrics", "Operational counters for sessions, calls, tools, and rate limits."],
  ["GET /inspect", "A local browser inspector for apps, functions, metrics, audit events, and snapshot JSON."]
];

const providers = [
  "ChatGPT Actions",
  "OpenAI Responses",
  "Claude Desktop",
  "Cursor",
  "MCP clients",
  "Anthropic",
  "Gemini",
  "AWS Bedrock",
  "Vercel AI SDK",
  "LangChain",
  "OpenRouter",
  "Ollama",
  "LM Studio",
  "Groq",
  "Mistral",
  "Cohere"
];

const safety = [
  ["Input validation", "Every action receives JSON validated by the declared schema."],
  ["In-app approval", "Sensitive calls pause inside the app until the user confirms."],
  ["Agent scoping", "allowedAgents and gateway profiles hide or block tools per provider."],
  ["Rate limits", "Per-agent and per-tool limits reduce accidental loops."],
  ["Idempotency", "Safe retries avoid running the same write twice."],
  ["Audit logs", "Calls, approvals, denials, and failures can be traced."]
];

const developerExperience = [
  ["Inspector", "Open `/inspect` during development to see connected apps, functions, metrics, audit events, and raw gateway snapshot data."],
  ["Security doctor", "Run `--security-doctor` before sharing a hosted connection to catch unsafe transport and missing approval UI."],
  ["Schema adapters", "Use Zod, TypeBox-style JSON Schema, or the built-in helpers without changing the gateway contract."],
  ["Native assistant bridges", "Generate App Intents and Android App Actions plans from the same capability manifest."]
];

const productionGateway = [
  ["Auth", "Use app session auth plus HTTP API keys or per-agent keys before exposing a gateway."],
  ["Deploy", "Run `mobigent-http` behind HTTPS/WSS with the included Dockerfile or your Node platform."],
  ["Observe", "Use `/health`, `/ready`, `/metrics`, `/metrics/prometheus`, `/apps`, and `/audit`."],
  ["Restrict", "Set allowed app ids, signed manifests, CORS origins, JSON limits, and agent profiles."],
  ["Retry safely", "Forward request ids and idempotency keys from provider calls."]
];

function Docs() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="./" aria-label="Mobigent home">
          <img className="brandMark" src="./mobigent-mark.svg" alt="" />
          <span>Mobigent</span>
        </a>
        <div className="navLinks">
          <a href="./">Home</a>
          <a href="#quickstart">Quickstart</a>
          <a href="#native">Native</a>
          <a href="#sdk">SDK</a>
          <a href="#production">Production</a>
          <a href="#providers">Providers</a>
          <a href="#security">Security</a>
          <a className="ghostButton" href="https://github.com/mobigent/mobigent">
            <Github size={16} />
            GitHub
          </a>
        </div>
      </nav>

      <section className="section docsHero">
        <div>
          <div className="eyebrow">
            <BookOpen size={15} />
            Mobigent docs
          </div>
          <h1>Everything you need to make a mobile app agent-ready.</h1>
          <p>
            Mobigent lets a mobile app expose typed actions, resources, screens, and approval flows to AI
            agents through a backend package that handles the bridge details. The app stays the source of truth.
          </p>
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Workflow size={15} /> Mental model</span>
          <h2>Four pieces, one clean contract.</h2>
        </div>
        <div className="tableGrid">
          {model.map(([title, text]) => (
            <Row key={title} title={title} text={text} />
          ))}
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Rocket size={15} /> First five minutes</span>
          <h2>A good first run should feel like one click.</h2>
        </div>
        <div className="codeGrid three">
          <Code title="Create a starter today" code={demoCode} />
          <Code title="Local starter from repo" code={localStarterCode} />
          <Code title="Run repo demo" code={repoDemoCode} />
          <div className="tableGrid nativeLifecycleGrid">
            {firstRunChecks.map(([title, text]) => (
              <Row key={title} title={title} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section id="quickstart" className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Rocket size={15} /> Quickstart</span>
          <h2>Install two packages, expose one app function.</h2>
          <p>Use this path for the first integration. After it works, add more features by product area.</p>
        </div>
        <div className="codeGrid docsCodeGrid">
          <Code title="1. Install and scaffold" code={quickstart} />
          <Code title="2. Define app capability" code={moduleCode} />
          <Code title="3. Wrap the app" code={appCode} />
          <Code title="Custom folder layout" code={customLayoutCode} />
        </div>
      </section>

      <section className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Terminal size={15} /> Backend usage</span>
          <h2>Call app functions like backend functions.</h2>
          <p>The generated backend entrypoint exports helpers so your app server does not need to think about bridge internals.</p>
        </div>
        <div className="codeGrid two">
          <Code title="Generated backend helpers" code={backendHelperCode} />
          <div className="apiList endpointList">
            {backendApis.map(([name, text]) => (
              <Row key={name} title={name} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section id="sdk" className="section docsBlock">
        <div className="sectionHeader">
          <span className="eyebrow"><Code2 size={15} /> SDK surface</span>
          <h2>What Mobigent exposes.</h2>
          <p>The SDK is small on purpose: declare functions in the app, run one backend helper, then connect providers after the app loop works.</p>
        </div>

        <div className="docsGrid packageGrid">
          {packages.map(([name, label, text]) => (
            <article className="docCard" key={name}>
              <div className="icon"><Terminal /></div>
              <h3>{name}</h3>
              <strong className="cardKicker">{label}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Smartphone size={15} /> Native SDKs</span>
          <h2>iOS and Android use the same capability contract.</h2>
          <p>Native apps do not need React Native. They register the same actions, resources, components, confirmations, events, and schemas directly from Swift or Kotlin.</p>
        </div>
        <div className="apiList">
          {nativeApis.map(([name, text]) => (
            <Row key={name} title={name} text={text} />
          ))}
        </div>
      </section>

      <section id="native" className="section codeSection">
        <div className="sectionHeader">
          <span className="eyebrow"><Smartphone size={15} /> Native quickstart</span>
          <h2>Drop Mobigent into a native app and expose real app behavior.</h2>
          <p>Start with one read resource and one confirmed write action. Once the app connects, the backend makes those functions available to agent runtimes.</p>
        </div>
        <div className="codeGrid two nativeCodeGrid">
          <Code title="iOS install" code={iosInstallCode} />
          <Code title="Android install" code={androidInstallCode} />
        </div>
        <div className="codeGrid two nativeCodeGrid spacious">
          <Code title="iOS Swift usage" code={iosUsageCode} />
          <Code title="Android Kotlin usage" code={androidUsageCode} />
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Workflow size={15} /> Native lifecycle</span>
          <h2>What happens at runtime.</h2>
        </div>
        <div className="tableGrid nativeLifecycleGrid">
          {nativeLifecycle.map(([title, text]) => (
            <Row key={title} title={title} text={text} />
          ))}
        </div>
        <div className="tableGrid nativeUrlGrid">
          {nativeUrls.map(([title, text]) => (
            <Row key={title} title={title} text={text} />
          ))}
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Smartphone size={15} /> App capabilities</span>
          <h2>Build a stable interface over real app behavior.</h2>
        </div>
        <div className="tableGrid threeCol">
          {capabilities.map(([name, purpose, example]) => (
            <div className="tableRow" key={name}>
              <strong>{name}</strong>
              <span>{purpose}</span>
              <code>{example}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Smartphone size={15} /> React Native API</span>
          <h2>The APIs you will use most.</h2>
        </div>
        <div className="apiList">
          {reactNativeApis.map(([name, text]) => (
            <Row key={name} title={name} text={text} />
          ))}
        </div>
      </section>

      <section className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><ShieldCheck size={15} /> Developer workflow</span>
          <h2>Build, inspect, and harden before you connect a real agent.</h2>
        </div>
        <div className="tableGrid nativeLifecycleGrid">
          {developerExperience.map(([title, text]) => (
            <Row key={title} title={title} text={text} />
          ))}
        </div>
        <div className="codeGrid three">
          <Code title="Security doctor" code={securityDoctorCode} />
          <Code title="Schema adapters" code={schemaAdapterCode} />
          <Code title="Native assistant bridges" code={platformActionsCode} />
        </div>
      </section>

      <section className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Network size={15} /> Backend</span>
          <h2>One backend function, multiple agent protocols.</h2>
          <p>Use the backend SDK in Node. The lower-level CLI stays available when you want a separate gateway process.</p>
        </div>
        <div className="codeGrid three">
          <Code title="Backend init" code={backendInitCode} />
          <Code title="Backend SDK" code={backendCode} />
          <div className="apiList endpointList">
            {gatewayEndpoints.map(([name, text]) => (
              <Row key={name} title={name} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section id="production" className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Network size={15} /> Production gateway</span>
          <h2>Ship the gateway like an API service.</h2>
          <p>Use the Dockerfile or `npx mobigent-http`, put it behind HTTPS/WSS, require auth, and monitor readiness before agent startup.</p>
        </div>
        <div className="apiList">
          {productionGateway.map(([name, text]) => (
            <Row key={name} title={name} text={text} />
          ))}
        </div>
      </section>

      <section id="providers" className="section docsBlock">
        <div className="sectionHeader">
          <span className="eyebrow"><KeyRound size={15} /> Provider setup</span>
          <h2>Use the same mobile capabilities from many agent runtimes.</h2>
          <p>Provider helpers generate configuration and runtime adapters. Public hosted providers need a public gateway URL; local agents can use localhost or MCP.</p>
        </div>
        <div className="codeGrid two">
          <Code title="ChatGPT Actions helper" code={providerCode} />
          <div className="tagCloud" aria-label="Supported providers">
            {providers.map((provider) => (
              <span key={provider}><Check size={14} /> {provider}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="section security">
        <div>
          <span className="eyebrow"><Lock size={15} /> Security model</span>
          <h2>The app stays in charge. Agents only get declared capability.</h2>
          <p>
            Start read-only, add one approved write action, then expand by feature module. Keep high-risk work behind confirmation and agent-specific policies.
          </p>
        </div>
        <div className="securityList">
          {safety.map(([title, text]) => (
            <article className="securityItem" key={title}>
              <div className="icon"><ShieldCheck /></div>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section finalCta">
        <div className="launchCard">
          <strong>Recommended first build</strong>
          <p>Expose one read resource and one confirmed write action from a real screen. Then connect ChatGPT Actions or an MCP client and test the full loop.</p>
          <a className="primaryButton" href="https://github.com/mobigent/mobigent">
            Open the repo
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </main>
  );
}

function Row({ title, text }: { title: string; text: string }) {
  return (
    <div className="tableRow">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <article className="codeCard">
      <div className="codeTitle">{title}</div>
      <pre>{code}</pre>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<Docs />);
