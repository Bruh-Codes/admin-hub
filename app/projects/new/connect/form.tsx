"use client";

import { useEffect, useState } from "react";
import { CopyBlock } from "@/components/copy-block";
import { hubClient } from "@/lib/hub/client";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const KEY_STORE = "admin-hub:new-project-key";

function newKey() {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return "ahk_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const MOUNT_SERVER = `import { betterAuth } from "better-auth";
import { adminHub } from "./admin-hub";

export const auth = betterAuth({
  // ...your config
  plugins: [
    // ...your plugins
    adminHub({ key: process.env.ADMIN_HUB_KEY }),
  ],
});`;

type State = "done" | "current" | "todo";

export function NewProjectForm({ hubUrl }: { hubUrl: string }) {
	const [name, setName] = useState("");
	const [key, setKey] = useState("");
	const [installed, setInstalled] = useState(false);
	const [keyCopied, setKeyCopied] = useState(false);
	const [url, setUrl] = useState("");
	const [basePath, setBasePath] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	// Keep the generated key across reloads of this tab, so the value already
	// pasted into the app's env stays valid.
	useEffect(() => {
		let k = "";
		try { k = sessionStorage.getItem(KEY_STORE) ?? ""; } catch {}
		if (!k) {
			k = newKey();
			try { sessionStorage.setItem(KEY_STORE, k); } catch {}
		}
		setKey(k);
	}, []);

	const slug = slugify(name);
	const install = `curl -fsSL -o lib/admin-hub.ts ${hubUrl || "https://your-hub.vercel.app"}/plugin/admin-hub.ts`;
	const env = `ADMIN_HUB_KEY=${key}`;

	const s1 = slug ? "done" : "current";
	const s2: State = !slug ? "todo" : installed ? "done" : "current";
	const s3: State = !slug ? "todo" : keyCopied ? "done" : installed ? "current" : "todo";
	const s4: State = slug && keyCopied ? "current" : "todo";
	const steps: [string, string, State][] = [
		["Project Details", "Name your project", s1],
		["Setup Plugin", "Install & configure", s2],
		["Environment Variables", "Add your API key", s3],
		["Connect", "Verify connection", s4],
	];

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const connection = { kind: "app", url: url.trim(), key, basePath: basePath.trim() || "/api/auth" };

		setBusy("Checking your app…");
		const test = await fetch("/api/connection-test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(connection) });
		const tested = await test.json().catch(() => ({}));
		if (!test.ok) {
			setBusy(null);
			return setError(tested.error ?? "Could not reach your app.");
		}

		setBusy("Creating project…");
		const { error } = await hubClient.organization.create({ name: name.trim(), slug, keepCurrentActiveOrganization: true });
		if (error) {
			setBusy(null);
			return setError(error.message ?? "Could not create the project.");
		}
		const saved = await fetch(`/api/projects/${slug}/connection`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(connection) });
		if (!saved.ok) {
			// Keep the key: the project exists, but the hub couldn't store the
			// connection. Say why instead of silently dropping to Settings.
			const body = await saved.json().catch(() => ({}));
			setBusy(null);
			return setError(`The project was created, but the hub couldn't save the connection: ${body.error ?? `HTTP ${saved.status}`}. Fix that, then connect it from the project's Settings with the same key.`);
		}
		try { sessionStorage.removeItem(KEY_STORE); } catch {}
		window.location.href = `/p/${slug}`;
	}

	return (
		<div className="onboard">
			<form className="onboard-main" onSubmit={submit}>
				<a href="/projects/new" className="muted" style={{ fontSize: 15 }}>← Back</a>
				<h1 style={{ marginTop: 16 }}>Create Project</h1>
				<p className="muted" style={{ marginTop: 6 }}>Connect an existing Better Auth app. It takes about two minutes.</p>

				<section className="onboard-section">
					<h2>Project Name</h2>
					<p>What you call this product in the hub.</p>
					<input className="input" value={name} required placeholder="My App" disabled={!!busy} onChange={(e) => setName(e.target.value)} autoFocus />
					{slug ? <p className="hint">Its link will be <span className="mono">/p/{slug}</span></p> : null}
				</section>

				<div className={slug ? "" : "dim"}>
					<section className="onboard-section">
						<h2>Install Plugin</h2>
						<p>Run this in the folder that holds your auth config's lib/ (change the path if yours lives elsewhere). On Windows PowerShell, type curl.exe instead of curl.</p>
						<CopyBlock label="Terminal" code={install} onCopy={() => setInstalled(true)} />
					</section>

					<section className="onboard-section">
						<h2>Mount Plugin</h2>
						<p>Add the plugin to your Better Auth config. There's nothing to add on the client.</p>
						<CopyBlock label="lib/auth.ts" code={MOUNT_SERVER} onCopy={() => setInstalled(true)} />
					</section>

					<section className="onboard-section">
						<h2>Environment Variables</h2>
						<p>Add this to your app's environment, then redeploy it. The hub keeps a copy; you won't see it again after creating the project.</p>
						<CopyBlock label=".env" code={env} tone="secret" onCopy={() => setKeyCopied(true)} />
						<p className="hint" style={{ marginTop: 10 }}>Remember to redeploy your app after adding the variable.</p>
					</section>

					<section className="onboard-section">
						<h2>Connect Your App</h2>
						<p>Where your app runs. The hub checks it can reach the plugin before creating the project.</p>
						<div className="stack" style={{ gap: 20 }}>
							<div>
								<label className="label" htmlFor="url">Base URL</label>
								<input id="url" className="input" required type="url" placeholder="https://app.example.com" disabled={!!busy} value={url} onChange={(e) => setUrl(e.target.value)} />
							</div>
							<div>
								<label className="label" htmlFor="bp">Base Path <span className="faint" style={{ fontWeight: 400 }}>(optional)</span></label>
								<input id="bp" className="input mono" placeholder="/api/auth" disabled={!!busy} value={basePath} onChange={(e) => setBasePath(e.target.value)} />
								<p className="hint">Only if you changed Better Auth's basePath.</p>
							</div>
						</div>
						<div style={{ marginTop: 24 }}>
							<details className="disclosure" style={{ borderBottom: "1px solid var(--line)" }}>
								<summary>Testing with localhost? <span className="faint">+</span></summary>
								<p>The hub runs on Vercel, so it can't reach <span className="mono">localhost</span> on your computer. Use a preview deployment, or expose your dev server with a tunnel (for example <span className="mono">npx cloudflared tunnel --url http://localhost:3000</span>) and paste that https URL.</p>
							</details>
						</div>
					</section>

					{error ? <p className="error" style={{ marginTop: 24 }}>{error}</p> : null}
					<button className="btn btn-primary" style={{ marginTop: 32, width: "100%" }} disabled={!!busy || !slug || !url || !key}>
						{busy ?? "Create Project"}
					</button>
				</div>
			</form>

			<aside className="onboard-side">
				<ol className="steps">
					{steps.map(([title, sub, state], i) => (
						<li key={title} data-state={state}>
							<span className="step-dot">{state === "done" ? "✓" : i + 1}</span>
							<div>
								<div className="step-title">{title}</div>
								<div className="step-sub">{sub}</div>
							</div>
						</li>
					))}
				</ol>
			</aside>
		</div>
	);
}
