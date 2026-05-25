import { ArrowRight, BookOpen, Check, Code2, Github, Lock, Network, Rocket, ShieldCheck, Smartphone } from "lucide-react";
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
    read: async () => ({ items: await listExpenses() })
  }]
});`;

const sections = [
  {
    icon: <Smartphone />,
    title: "React Native + Expo",
    text: "Wrap the app once with createAgentExpoApp(), then expose feature modules from screens or app bootstrap.",
    bullets: ["createAgentExpoApp()", "createAgentModule()", "useAgentScreen()", "AgentAction / AgentResource"]
  },
  {
    icon: <Network />,
    title: "Gateway",
    text: "The gateway keeps app sessions live and turns mobile capabilities into agent-facing endpoints.",
    bullets: ["mobigent-gateway", "mobigent-http", "mobigent-mcp", "live tool discovery"]
  },
  {
    icon: <Code2 />,
    title: "Provider adapters",
    text: "Generate setup for ChatGPT Actions, Claude Desktop, Cursor, OpenAI, Anthropic, Gemini, Bedrock, and more.",
    bullets: ["mobigent-provider", "OpenAPI", "MCP", "runtime adapters"]
  },
  {
    icon: <ShieldCheck />,
    title: "Safety",
    text: "Keep the app as the trust boundary with approval prompts, policies, API keys, signatures, and audit logs.",
    bullets: ["risk levels", "allowed agents", "rate limits", "redaction"]
  }
];

function Docs() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="./" aria-label="Mobigent home">
          <span className="brandMark">M</span>
          <span>Mobigent</span>
        </a>
        <div className="navLinks">
          <a href="./">Home</a>
          <a href="#quickstart">Quickstart</a>
          <a href="#sdk">SDK</a>
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
          <h1>Build agent-ready mobile apps with confidence.</h1>
          <p>
            The fastest path: scaffold the Expo integration, define one feature module, run the gateway,
            and let agents call real app logic through a safe contract.
          </p>
        </div>
      </section>

      <section id="quickstart" className="section codeSection">
        <div className="sectionHeader compact">
          <span className="eyebrow"><Rocket size={15} /> Quickstart</span>
          <h2>From app to agent capability in one smooth pass.</h2>
        </div>
        <div className="codeGrid two">
          <Code title="1. Install and scaffold" code={quickstart} />
          <Code title="2. Define a module" code={moduleCode} />
        </div>
      </section>

      <section id="sdk" className="section">
        <div className="sectionHeader">
          <span className="eyebrow"><ArrowRight size={15} /> Core docs</span>
          <h2>Everything is app-owned, typed, and easy to reason about.</h2>
        </div>
        <div className="docsGrid">
          {sections.map((section) => (
            <article className="docCard" key={section.title}>
              <div className="icon">{section.icon}</div>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}><Check size={14} /> {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="section security">
        <div>
          <span className="eyebrow"><Lock size={15} /> Security</span>
          <h2>The app stays in charge. That is the whole point.</h2>
          <p>
            Mobigent is built for ambitious agent workflows without reckless access. Every sensitive call can
            require user approval, scoped agent identity, idempotency, signed manifests, and audit redaction.
          </p>
        </div>
        <div className="launchCard">
          <strong>Recommended launch path</strong>
          <p>Start read-only, add one approved write action, then expand by feature module as confidence grows.</p>
          <a className="primaryButton" href="https://github.com/mobigent/mobigent">
            Open the repo
            <Github size={17} />
          </a>
        </div>
      </section>
    </main>
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
