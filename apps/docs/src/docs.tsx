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

const existingAppInstallCode = `npm install @mobigent/app
npm install @mobigent/backend`;

const existingAppFallbackCode = `npm exec --yes \\
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \\
  -- mobigent-install app

npm exec --yes \\
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \\
  -- mobigent-install backend`;

const existingAppRecipeCode = `// App
export default withMobigent(App, {
  expense: { list, create }
});

// Backend
const mobigent = await startMobigent();

await mobigent.functions.expense.create(input);`;

const deviceConnectionCode = `export const mobigent = createApp({
  expense: { list, create }
}, {
  backend
});

// production env/config:
MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_APP=com.acme.expenses
EXPO_PUBLIC_MOBIGENT_URL=wss://your-backend.example.com`;

const demoCode = `npm exec --yes \\
  --package https://github.com/mobigent/mobigent/releases/download/v0.1.15/create-mobigent-app-0.1.15.tgz \\
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

const moduleCode = `import { createApp } from "@mobigent/app";

export const mobigent = createApp({
  expense: {
    list: async () => ({
      items: await listExpenses()
    }),
    create: async (input) => createExpense(input)
  }
});`;

const optionalMetadataCode = `import { write } from "@mobigent/app";

create: write(createExpense, {
  input: {
    merchant: "string",
    amount: "number"
  },
  confirm: "Create expense?"
})`;

const appCode = `import { mobigent } from "./mobigent";
import App from "./App";

export default mobigent.with(App);`;

const directWrapCode = `import { withMobigent } from "@mobigent/app";
import App from "./App";

export default withMobigent(App, {
  expense: {
    list: async () => ({ items: await listExpenses() }),
    create: async (input) => createExpense(input)
  }
});`;

const backendCode = `import { startMobigent } from "@mobigent/backend";

const mobigent = await startMobigent();

await mobigent.functions.expense.create({ merchant: "Airport Taxi", amount: 42.25 });
await mobigent.functions.expense.list();

console.log(mobigent.inspectorUrl);`;

const backendShortCode = `const mobigent = await startMobigent();`;

const backendUseCode = `const expenses = mobigent.functions.expense;

await expenses.create({
  merchant: "Airport Taxi",
  amount: 42.25
});`;

const doctorCode = `npm run doctor

# checks:
# app reachable
# backend ready
# app functions visible`;

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

const platformActionsCode = `npx mobigent app \\
  --platform-actions json \\
  --app-id com.example.app \\
  --app-name "Example App" \\
  --feature expense

npx mobigent app --platform-actions ios-swift ...
npx mobigent app --platform-actions android-xml ...`;

const providerCode = `const chatgpt = mobigent.connect.chatgpt({
  publicUrl: "https://backend.example.com",
  auth: "api-key"
});

console.log(chatgpt.guide);`;

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
  version: "1.0.0"
)

client.write(
  name: "expense.create",
  description: "Create an expense after approval.",
  inputSchema: .object([
    "merchant": .string(),
    "amount": .number()
  ], required: ["merchant", "amount"]),
  confirmation: .init(required: true, risk: .medium)
) { input in
  createExpense(input)
}

client.read(
  name: "expense.list",
  description: "Read saved expenses.",
  outputSchema: .object([
    "items": .array(.object([
      "merchant": .string(),
      "amount": .number()
    ]))
  ])
) {
  ["items": listExpenses()]
}

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

const androidUsageCode = `import io.mobigent.MobigentClient
import io.mobigent.MobigentConfirmationPolicy
import io.mobigent.MobigentRisk
import io.mobigent.MobigentSchema

val client = MobigentClient.Builder(context)
  .appId("com.example.expense")
  .appName("Expense App")
  .version("1.0.0")
  .build()

client.write(
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
) { input ->
  createExpense(input)
}

client.read(
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
) {
  mapOf("items" to listExpenses())
}

client.confirmationHandler { request ->
  showApprovalDialog(request)
}

client.connect()`;

const nativeLifecycle = [
  ["1. Create a client", "Give Mobigent the app functions. Local simulator/emulator URLs are the SDK defaults."],
  ["2. Expose app functions", "Use write for confirmed changes, read for app data, and screen for important UI context."],
  ["3. Add confirmations", "Mark risky actions and let the native app render the approval UI."],
  ["4. Connect", "The SDK connects to the backend and exposes those functions."],
  ["5. Emit events", "Send app events such as expense.created or sync.failed back to the agent."]
];

const nativeUrls = [
  ["iOS simulator default", "ws://localhost:8787"],
  ["Android emulator default", "ws://10.0.2.2:8787"],
  ["Physical device override", "ws://YOUR_MAC_LAN_IP:8787"],
  ["Hosted backend override", "wss://backend.example.com"]
];

const firstRunChecks = [
  ["Install", "Add the app package to React Native and the backend package to your server."],
  ["Expose", "`createApp(functions)` turns real app functions into typed agent-callable APIs."],
  ["Connect", "Use local defaults first; set env config for production instead of threading ids through code."],
  ["Call", "`mobigent.functions.expense.create()` calls the app-owned function from backend code."],
  ["Approve", "Risky actions pause inside the app before handlers run."],
  ["Audit", "Calls, approvals, denials, errors, and events appear in `/audit`."]
];

const model = [
  ["App package", "Lives inside the mobile app and exposes real app functions."],
  ["Backend package", "Runs the agent-facing service, waits for the app, and gives agents a clean callable API."],
  ["Agent", "Calls typed functions and receives typed results instead of touching the UI."],
  ["User", "Approves risky actions inside the app before handlers run."]
];

const functionKinds = [
  ["Actions", "Write or command operations", "create expense, submit order, update profile"],
  ["Resources", "Read-only app data", "list expenses, get active workspace, read cart"],
  ["Surfaces", "Screen-aware context", "current route, focused record, visible component"],
  ["Events", "App-to-agent signals", "expense.created, sync.failed, user.selected"],
  ["Confirmations", "User approval gates", "medium or high risk writes"]
];

const packages = [
  ["mobigent", "Friendly CLI", "One command for starters, app function setup, backend setup, and agent setup."],
  ["create-mobigent-app", "Starter generator", "Creates a runnable app with backend, inspector, visible state, and an agent playground."],
  ["@mobigent/app", "App-side SDK", "Expo/React Native roots, modules, hooks, UI helpers, confirmation flow."],
  ["@mobigent/backend", "Backend SDK", "One function starts the backend, exposes agent setup, waits for app readiness, and routes calls."],
  ["Mobigent iOS", "Swift package", "Native iOS client with actions, resources, components, confirmations, reconnect, heartbeat, and events."],
  ["Mobigent Android", "Kotlin library", "Native Android client with local emulator-friendly defaults and the same app function model."]
];

const reactNativeApis = [
  ["createApp()", "Creates one app SDK object from app functions and optional backend settings."],
  ["read()", "Exposes read-only app data to agents."],
  ["write()", "Exposes a confirmed app action with plain input fields."],
  ["screen()", "Exposes screen-aware app behavior when agents need to focus UI."],
  ["mobigent.with()", "Wraps the existing React Native app in one normal function call."],
  ["mobigent.connect()", "Connects a non-React host or local demo to a backend object."],
  ["mobigent.emit()", "Queues or sends app events without touching the lower-level client."],
  ["backend", "Accepts the backend object so the app does not know transport details."],
  ["connection", "Advanced fallback for physical phones or hosted `wss://` backend URLs."],
  ["useMobigentStatus()", "Reads connection state for badges, diagnostics, and debugging."],
  ["MobigentStatusBadge", "Optional UI component for local development visibility."]
];

const nativeApis = [
  ["iOS MobigentClient", "Swift client for registering app functions, connecting, emitting events, and reading diagnostics."],
  ["Android MobigentClient.Builder", "Kotlin builder for app identity, local defaults, reconnect, heartbeat, and transport setup."],
  ["MobigentSchema", "Shared native schema builders for string, number, boolean, object, array, and enum."],
  ["confirmation handler", "Native callback hook so the host app renders its own approval UI."]
];

const backendApis = [
  ["startMobigent()", "Starts the backend service with local defaults."],
  ["waitForApp()", "Optional health gate when startup should wait for a connected app."],
  ["functions", "Calls app functions from backend code with the same namespaces used in the app."],
  ["use()", "Optional helper aliasing when backend code wants different function names."],
  ["call()", "Makes a quick one-off app function call by name."],
  ["fn()", "Creates a reusable backend function wrapper for repeated calls."],
  ["connect.chatgpt()", "Connects ChatGPT, Claude, or OpenAI after the app loop works."]
];

const backendRuntime = [
  ["App connection", "Keeps mobile app sessions connected and reconnects when needed."],
  ["Function routing", "Maps backend calls such as `mobigent.functions.expense.create()` to the right app-owned handler."],
  ["Readiness", "Waits for connected apps before the backend or agent flow calls app functions."],
  ["Validation", "Checks input and output shapes before results leave the app boundary."],
  ["Approvals", "Pauses risky writes inside the app until the user confirms."],
  ["Agent setup", "Generates provider setup after the app/backend loop works."],
  ["Inspector", "Shows connected apps, functions, metrics, and audit events during development."],
  ["Audit", "Records calls, approvals, denials, errors, and app events for debugging."]
];

const providers = [
  "ChatGPT Actions",
  "OpenAI Responses",
  "Claude Desktop",
  "Cursor",
  "Local agent clients",
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
  ["Agent scoping", "Agent profiles hide or block functions per provider."],
  ["Rate limits", "Per-agent and per-function limits reduce accidental loops."],
  ["Idempotency", "Safe retries avoid running the same write twice."],
  ["Audit logs", "Calls, approvals, denials, and failures can be traced."]
];

const developerExperience = [
  ["Inspector", "Open the inspector during development to see connected apps, functions, metrics, and audit events."],
  ["Security doctor", "Run `--security-doctor` before sharing a hosted connection to catch unsafe transport and missing approval UI."],
  ["Schema adapters", "Use Zod, TypeBox-style JSON Schema, or the built-in helpers without changing app code shape."],
  ["Native assistant bridges", "Generate App Intents and Android App Actions plans from the same app function definitions."]
];

const productionBackend = [
  ["Auth", "Use app session auth plus HTTP API keys or per-agent keys before exposing a hosted backend."],
  ["Deploy", "Run Mobigent behind HTTPS/WSS with the included Dockerfile or your Node platform."],
  ["Observe", "Use `/health`, `/ready`, `/metrics`, `/metrics/prometheus`, `/apps`, and `/audit`."],
  ["Restrict", "Set allowed app ids, signed app definitions, CORS origins, JSON limits, and agent profiles."],
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
          <a href="#providers">Agents</a>
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
            Mobigent lets a mobile app expose real app functions to AI agents through two normal packages.
            The app owns the behavior, the backend calls it, and the SDK handles the connection details.
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
          <Code title="1. Install packages" code={existingAppInstallCode} />
          <Code title="Temporary public fallback" code={existingAppFallbackCode} />
          <Code title="2. Define app functions" code={moduleCode} />
          <Code title="Optional validation and approval copy" code={optionalMetadataCode} />
          <Code title="3. Wrap the app" code={appCode} />
          <Code title="One-file wrap option" code={directWrapCode} />
          <Code title="4. Physical phone or hosted backend" code={deviceConnectionCode} />
        </div>
      </section>

      <section className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Smartphone size={15} /> Existing app path</span>
          <h2>No generator. No copied config. Just app code and backend code.</h2>
          <p>
            In a real React Native app, write Mobigent beside the functions you already own. The sample generator is only for runnable demos.
          </p>
        </div>
        <div className="codeGrid two">
          <Code title="The whole adoption shape" code={existingAppRecipeCode} />
          <div className="apiList endpointList">
            <Row title="Developer chooses" text="The small set of app functions agents may call." />
            <Row title="SDK handles" text="Connection, discovery, validation, approvals, retries, events, inspector, and agent setup." />
            <Row title="Read more" text="Open docs/existing-react-native-app.md for the copy-paste existing-app recipe." />
          </div>
        </div>
      </section>

      <section className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Terminal size={15} /> Backend usage</span>
          <h2>Call app functions like backend functions.</h2>
          <p>Start Mobigent in your server, wait for the app, then call app-owned functions from the clean package API.</p>
        </div>
        <div className="codeGrid two">
          <Code title="Backend SDK" code={backendCode} />
          <Code title="Backend helper names" code={backendUseCode} />
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
          <p>The day-one SDK surface is small on purpose: declare functions in the app, run one backend helper, then connect agents after the app loop works.</p>
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
          <h2>iOS and Android use the same app function contract.</h2>
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
          <span className="eyebrow"><Smartphone size={15} /> App function types</span>
          <h2>Build a stable interface over real app behavior.</h2>
        </div>
        <div className="tableGrid threeCol">
          {functionKinds.map(([name, purpose, example]) => (
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
          <Code title="Project doctor" code={doctorCode} />
          <Code title="Schema adapters" code={schemaAdapterCode} />
          <Code title="Native assistant bridges" code={platformActionsCode} />
        </div>
      </section>

      <section className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Network size={15} /> Backend</span>
          <h2>The backend package owns the hard parts.</h2>
          <p>Use the backend SDK in Node. Most apps should start with `startMobigent()` and let the SDK run the service.</p>
        </div>
        <div className="codeGrid three">
          <Code title="Backend SDK" code={backendCode} />
          <Code title="Shortest explicit start" code={backendShortCode} />
          <Code title="Backend helper names" code={backendUseCode} />
          <div className="apiList endpointList">
            {backendRuntime.map(([name, text]) => (
              <Row key={name} title={name} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section id="production" className="section docsBlock">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Network size={15} /> Hosted backend</span>
          <h2>Ship Mobigent like backend infrastructure.</h2>
          <p>Put the backend behind HTTPS/WSS, require auth, and monitor readiness before agent startup.</p>
        </div>
        <div className="apiList">
          {productionBackend.map(([name, text]) => (
            <Row key={name} title={name} text={text} />
          ))}
        </div>
      </section>

      <section id="providers" className="section docsBlock">
        <div className="sectionHeader">
          <span className="eyebrow"><KeyRound size={15} /> Agent setup</span>
          <h2>Use the same app functions from many agent runtimes.</h2>
          <p>The backend package gives you connect helpers for ChatGPT, Claude, OpenAI, and other agent runtimes. Public hosted agents need a public backend URL; local agents can use localhost.</p>
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
          <h2>The app stays in charge. Agents only get declared app functions.</h2>
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
          <p>Expose one read function and one confirmed write function from real app logic. Then connect one agent and test the full loop.</p>
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
