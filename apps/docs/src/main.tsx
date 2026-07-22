import {
  ArrowRight,
  Check,
  Github,
  Lock,
  PlugZap,
  Radio,
  ShieldCheck,
  Smartphone,
  Terminal,
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const quickstart = `npm install @mobigent/app
npm install @mobigent/backend

export default withMobigent(App, {
  expense: { list, create }
});
type MyAppFunctions = {
  expense: { list: typeof list; create: typeof create }
};

const mobigent = await startMobigent();
const app = mobigent.app<MyAppFunctions>();

await app.expense.create(input);`;

function App() {
  return (
    <main>
      <Nav />
      <section id="top" className="hero section">
        <div className="heroCopy">
          <div className="eyebrow">
            <Radio size={15} />
            Open-source agent infrastructure for mobile apps
          </div>
          <h1>Make real app functions available to AI agents.</h1>
          <p>
            Install the app package, install the backend package, expose real app functions with
            withMobigent(App, functions) or createApp(functions), then startMobigent() and call
            app.expense.create(input) through mobigent.app&lt;MyAppFunctions&gt;(). Mobigent handles
            app delivery, approvals, retries, discovery, and agent setup.
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
            <span>
              <Check size={15} /> Expo-first
            </span>
            <span>
              <Check size={15} /> Backend package
            </span>
            <span>
              <Check size={15} /> In-app approval
            </span>
          </div>
        </div>
        <div className="heroVisual" aria-label="Mobigent product mark and quickstart">
          <div className="logoHalo">
            <img className="heroLogo" src="./mobigent-mark.svg" alt="Mobigent MT logo" />
          </div>
          <div className="terminalPanel">
            <div className="terminalTop">
              <span />
              <span />
              <span />
              <strong>quickstart</strong>
            </div>
            <pre>{quickstart}</pre>
            <div className="signalGrid">
              <Metric label="Install" value="2 packages" />
              <Metric label="Surface" value="typed" />
              <Metric label="Control" value="yours" />
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="section compactSection">
        <div className="sectionHeader">
          <span className="eyebrow">
            <PlugZap size={15} /> Why Mobigent
          </span>
          <h2>Agents should call app functions, not guess through UI.</h2>
        </div>
        <div className="problemGrid">
          <Feature icon={<Smartphone />} title="Native app context">
            Use the session, auth, local state, and platform APIs your app already owns.
          </Feature>
          <Feature icon={<ShieldCheck />} title="Approval by design">
            Sensitive actions can stop inside the app until the user says yes.
          </Feature>
          <Feature icon={<Terminal />} title="Provider-ready">
            Start with the backend SDK, then connect ChatGPT Actions, Claude, Cursor, and more when
            you are ready.
          </Feature>
        </div>
      </section>

      <section id="demo" className="section compactSection">
        <div className="sectionHeader">
          <span className="eyebrow">
            <Terminal size={15} /> Try it now
          </span>
          <h2>See the full loop in 30 seconds. No signup, no app changes.</h2>
        </div>
        <div className="problemGrid">
          <div className="featureCard demoStep">
            <div className="icon">
              <span>1</span>
            </div>
            <h3>Clone and run</h3>
            <pre className="inlinePre">
              git clone https://github.com/mobigent/mobigent && cd mobigent && npm install && npm
              run demo:app
            </pre>
          </div>
          <div className="featureCard demoStep">
            <div className="icon">
              <span>2</span>
            </div>
            <h3>Open the inspector</h3>
            <pre className="inlinePre">open http://localhost:8788/inspect</pre>
          </div>
          <div className="featureCard demoStep">
            <div className="icon">
              <span>3</span>
            </div>
            <h3>Watch the agent call</h3>
            <p>
              The demo page at localhost:8790 shows live app state. Click Run agent request or call
              the API directly.
            </p>
          </div>
        </div>
      </section>

      <section className="section security">
        <div>
          <span className="eyebrow">
            <Lock size={15} /> The big idea
          </span>
          <h2>Your app functions, agent-accessible. You stay in control.</h2>
          <p>
            Define what agents may do. Keep the app in charge. Move fast without turning user trust
            into an experiment.
          </p>
        </div>
        <div className="launchCard">
          <strong>Build the first feature in minutes.</strong>
          <p>
            Install two packages, expose one function, run the backend, and your agent can call real
            app logic.
          </p>
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
        <img className="brandMark" src="./mobigent-mark.svg" alt="" />
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

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="featureCard">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
