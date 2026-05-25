import { ArrowRight, Check, Github, Lock, PlugZap, Radio, ShieldCheck, Smartphone, Terminal } from "lucide-react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const quickstart = `npx mobigent-init --app-id com.example.app --app-name "Example App" --feature expense --out-dir src --expo-router`;

function App() {
  return (
    <main>
      <Nav />
      <section id="top" className="hero section">
        <div className="heroCopy">
          <div className="eyebrow">
            <Radio size={15} />
            Open-source mobile agent infrastructure
          </div>
          <h1>Give AI agents a safe way into your mobile app.</h1>
          <p>
            Mobigent exposes real app actions, resources, and screens as typed agent capabilities, with
            user approval and app-owned control built in.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="./docs.html">
              Read the docs
              <ArrowRight size={17} />
            </a>
            <a className="secondaryButton" href="https://github.com/mobigent/mobigent">
              Star on GitHub
              <Github size={17} />
            </a>
          </div>
          <div className="proof">
            <span><Check size={15} /> Expo-first</span>
            <span><Check size={15} /> MCP + OpenAPI</span>
            <span><Check size={15} /> In-app approval</span>
          </div>
        </div>
        <div className="terminalPanel" aria-label="Mobigent quickstart">
          <div className="terminalTop">
            <span />
            <span />
            <span />
            <strong>ship it</strong>
          </div>
          <pre>{quickstart}</pre>
          <div className="signalGrid">
            <Metric label="Install" value="1 command" />
            <Metric label="Surface" value="typed" />
            <Metric label="Control" value="yours" />
          </div>
        </div>
      </section>

      <section id="why" className="section compactSection">
        <div className="sectionHeader">
          <span className="eyebrow"><PlugZap size={15} /> Why Mobigent</span>
          <h2>Agents should call app capabilities, not guess through UI.</h2>
        </div>
        <div className="problemGrid">
          <Feature icon={<Smartphone />} title="Native app context">
            Use the session, auth, local state, and platform APIs your app already owns.
          </Feature>
          <Feature icon={<ShieldCheck />} title="Approval by design">
            Sensitive actions can stop inside the app until the user says yes.
          </Feature>
          <Feature icon={<Terminal />} title="Provider-ready">
            Connect through MCP, HTTP, OpenAPI, ChatGPT Actions, Claude, Cursor, and more.
          </Feature>
        </div>
      </section>

      <section className="section security">
        <div>
          <span className="eyebrow"><Lock size={15} /> The big idea</span>
          <h2>Mobigent is the capability layer for agentic mobile apps.</h2>
          <p>
            Define what agents may do. Keep the app in charge. Move fast without turning user trust
            into an experiment.
          </p>
        </div>
        <div className="launchCard">
          <strong>Build the first feature in minutes.</strong>
          <p>Start with Expo, add a module, run the gateway, and your agent can call real app logic.</p>
          <a className="primaryButton" href="./docs.html">
            Open docs
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </main>
  );
}

function Nav() {
  return (
    <nav className="nav">
      <a className="brand" href="./" aria-label="Mobigent home">
        <span className="brandMark">M</span>
        <span>Mobigent</span>
      </a>
      <div className="navLinks">
        <a href="#why">Why</a>
        <a href="./docs.html">Docs</a>
        <a className="ghostButton" href="https://github.com/mobigent/mobigent">
          <Github size={16} />
          GitHub
        </a>
      </div>
    </nav>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article className="featureCard">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
