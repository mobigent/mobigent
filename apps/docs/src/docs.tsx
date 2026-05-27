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

const quickstart = `npm install @mobigent/react-native

npx mobigent-init \\
  --app-id com.example.app \\
  --app-name "Example App" \\
  --feature expense \\
  --out-dir src \\
  --expo-router`;

const moduleCode = `import { createAgentModule, schema } from "@mobigent/react-native/app";

export const expenseModule = createAgentModule({
  namespace: "expense",
  actions: [{
    name: "create",
    description: "Create an expense after approval.",
    inputSchema: schema.object({
      merchant: schema.string(),
      amount: schema.number()
    }, { required: "all" }),
    confirmation: { required: true, risk: "medium" },
    handler: async (input) => createExpense(input)
  }],
  resources: [{
    name: "list",
    description: "Read saved expenses.",
    read: async () => ({ items: await listExpenses() })
  }]
});`;

const appCode = `import Constants from "expo-constants";
import { createAgentExpoApp } from "@mobigent/react-native/app";
import { expenseModule } from "./mobigent/expense";

const { Root } = createAgentExpoApp({
  expo: Constants.expoConfig,
  modules: [expenseModule]
});

export default function App() {
  return <Root><YourApp /></Root>;
}`;

const gatewayCode = `npx mobigent-http

curl http://localhost:8788/health
curl http://localhost:8788/tools
curl http://localhost:8788/openapi.json

npx mobigent-mcp`;

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
import io.mobigent.MobigentResource
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
      "items" to MobigentSchema.array(
        MobigentSchema.obj(
          "merchant" to MobigentSchema.string(),
          "amount" to MobigentSchema.number()
        )
      )
    )
  ) { mapOf("items" to listExpenses()) }
)

client.registerAction(
  MobigentAction(
    name = "expense.create",
    description = "Create an expense after approval.",
    inputSchema = MobigentSchema.obj(
      "merchant" to MobigentSchema.string(),
      "amount" to MobigentSchema.number(),
      required = listOf("merchant", "amount")
    ),
    confirmation = MobigentAction.Confirmation.required("medium")
  ) { input -> createExpense(input) }
)

client.confirmationHandler { request ->
  showApprovalDialog(request)
}

client.connect()`;

const nativeLifecycle = [
  ["1. Create a client", "Give Mobigent the app id, app name, version, and gateway WebSocket URL."],
  ["2. Register capabilities", "Add actions for writes, resources for reads, and components for screen context."],
  ["3. Add confirmations", "Mark risky actions and let the native app render the approval UI."],
  ["4. Connect to gateway", "The SDK sends hello and manifest messages, then waits for calls."],
  ["5. Emit events", "Send app events such as expense.created or sync.failed back through the gateway."]
];

const nativeUrls = [
  ["iOS simulator", "ws://localhost:8787"],
  ["Android emulator", "ws://10.0.2.2:8787"],
  ["Physical device", "ws://YOUR_MAC_LAN_IP:8787"],
  ["Hosted gateway", "wss://your-gateway.example.com"]
];

const model = [
  ["App SDK", "Lives inside the mobile app and declares safe capabilities."],
  ["Gateway", "Keeps app sessions alive and exposes capabilities as HTTP, OpenAPI, or MCP."],
  ["Agent", "Discovers tools, calls them, and receives typed results instead of touching the UI."],
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
  ["@mobigent/react-native", "App-side SDK", "Expo/React Native roots, modules, hooks, UI helpers, confirmation flow."],
  ["Mobigent iOS", "Swift package", "Native iOS client with actions, resources, components, confirmations, reconnect, heartbeat, and events."],
  ["Mobigent Android", "Kotlin library", "Native Android client with the same gateway protocol and local emulator-friendly defaults."],
  ["@mobigent/gateway", "Agent bridge", "WebSocket app sessions, HTTP API, OpenAPI schema, MCP stdio server."],
  ["@mobigent/providers", "Agent setup", "Provider descriptors and runtime helpers for popular AI platforms."],
  ["@mobigent/core", "Protocol", "Shared types, protocol messages, schemas, and validation contracts."]
];

const reactNativeApis = [
  ["createAgentExpoApp()", "Expo-first app wrapper that reads Expo config and env settings."],
  ["createAgentApp()", "Framework-neutral React Native root for app identity and connection setup."],
  ["createAgentModule()", "Groups actions, resources, events, and surfaces under one namespace."],
  ["defineAgentAction()", "Declares a single callable operation with schema, policy, and handler."],
  ["defineAgentResource()", "Declares readable app state or records."],
  ["useAgentScreen()", "Makes screen-owned capabilities available only while the screen is mounted."],
  ["useMobigentStatus()", "Reads connection state for badges, diagnostics, and debugging."],
  ["MobigentStatusBadge", "Optional UI component for local development visibility."]
];

const nativeApis = [
  ["iOS MobigentClient", "Swift client for registering capabilities, connecting, emitting events, and reading diagnostics."],
  ["Android MobigentClient.Builder", "Kotlin builder for app identity, gateway URL, reconnect, heartbeat, and transport setup."],
  ["MobigentSchema", "Shared native schema builders for string, number, boolean, object, array, and enum."],
  ["confirmation handler", "Native callback hook so the host app renders its own approval UI."]
];

const gatewayEndpoints = [
  ["GET /health", "Liveness, session counts, tool counts, and operational status."],
  ["GET /ready", "Readiness check for deployments and agent startup."],
  ["GET /tools", "Agent-scoped tool discovery."],
  ["POST /tools/{name}/call", "Call a mobile capability with validated JSON input."],
  ["GET /openapi.json", "Importable OpenAPI schema for ChatGPT Actions and HTTP agents."],
  ["GET /providers", "Provider setup descriptors for supported agent platforms."],
  ["GET /audit", "Recent audit events for tool calls, approvals, and failures."],
  ["GET /metrics", "Operational counters for sessions, calls, tools, and rate limits."]
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
            agents through HTTP, OpenAPI, or MCP. The app stays the source of truth.
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

      <section id="quickstart" className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Rocket size={15} /> Quickstart</span>
          <h2>Start with Expo, add one module, run the gateway.</h2>
          <p>Use this path for the first integration. After it works, add more modules by feature area.</p>
        </div>
        <div className="codeGrid docsCodeGrid">
          <Code title="1. Install and scaffold" code={quickstart} />
          <Code title="2. Define app capability" code={moduleCode} />
          <Code title="3. Wrap the app" code={appCode} />
        </div>
      </section>

      <section id="sdk" className="section docsBlock">
        <div className="sectionHeader">
          <span className="eyebrow"><Code2 size={15} /> SDK surface</span>
          <h2>What Mobigent exposes.</h2>
          <p>The SDK is small on purpose: declare capabilities in the app, expose them through the gateway, then connect any provider that can call tools.</p>
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
          <p>Start with one read resource and one confirmed write action. Once the gateway sees the manifest, the same tools become available through HTTP, OpenAPI, ChatGPT Actions, and MCP.</p>
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
          <span className="eyebrow"><Network size={15} /> Gateway</span>
          <h2>One gateway, multiple agent protocols.</h2>
          <p>Run HTTP/OpenAPI for hosted providers and ChatGPT Actions. Run MCP for local MCP-compatible clients.</p>
        </div>
        <div className="codeGrid two">
          <Code title="Run and inspect" code={gatewayCode} />
          <div className="apiList endpointList">
            {gatewayEndpoints.map(([name, text]) => (
              <Row key={name} title={name} text={text} />
            ))}
          </div>
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
