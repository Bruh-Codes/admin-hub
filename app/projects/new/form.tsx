"use client";

import { useState } from "react";
import { PluginSteps } from "@/components/plugin-steps";
import { hubClient } from "@/lib/hub/client";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function NewProjectForm() {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);
	const [url, setUrl] = useState("");
	const [key, setKey] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [step, setStep] = useState<string | null>(null);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const connection = { kind: "app", url, key, basePath: "/api/auth" };

		setStep("Checking the app…");
		const test = await fetch("/api/connection-test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(connection) });
		const tested = await test.json().catch(() => ({}));
		if (!test.ok) {
			setStep(null);
			return setError(tested.error ?? "Could not reach the app.");
		}

		setStep("Creating the project…");
		const { error } = await hubClient.organization.create({ name: name.trim(), slug, keepCurrentActiveOrganization: true });
		if (error) {
			setStep(null);
			return setError(error.message ?? "Could not create the project.");
		}
		const saved = await fetch(`/api/projects/${slug}/connection`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(connection) });
		if (!saved.ok) {
			window.location.href = `/p/${slug}/settings?new=1`;
			return;
		}
		window.location.href = `/p/${slug}`;
	}

	const busy = step !== null;
	return (
		<form onSubmit={submit} className="stack" style={{ gap: 24 }}>
			<section className="card card-pad stack" style={{ gap: 20 }}>
				<h2>Project</h2>
				<div>
					<label className="label" htmlFor="name">Name</label>
					<input id="name" className="input" value={name} required placeholder="OnRecord" disabled={busy} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
				</div>
				<div>
					<label className="label" htmlFor="slug">Short name</label>
					<input id="slug" className="input mono" value={slug} required pattern="[a-z0-9-]+" disabled={busy} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
					<p className="hint">Used in links: /p/{slug || "…"}</p>
				</div>
			</section>

			<section className="card card-pad stack" style={{ gap: 20 }}>
				<div>
					<h2>Connect your app</h2>
					<p className="muted" style={{ marginTop: 6 }}>Your app needs the admin-hub plugin and an <span className="mono">ADMIN_HUB_KEY</span>.</p>
				</div>
				<div>
					<label className="label" htmlFor="url">App URL</label>
					<input id="url" className="input" required placeholder="https://app.example.com" disabled={busy} value={url} onChange={(e) => setUrl(e.target.value)} />
				</div>
				<div>
					<label className="label" htmlFor="key">Admin hub key</label>
					<input id="key" className="input mono" type="password" autoComplete="off" required placeholder="The app's ADMIN_HUB_KEY" disabled={busy} value={key} onChange={(e) => setKey(e.target.value)} />
				</div>
				<PluginSteps />
			</section>

			{error ? <p className="error">{error}</p> : null}
			<div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
				<button className="btn btn-primary" disabled={busy || !name || !slug || !url || !key}>{step ?? "Create project"}</button>
				<span className="faint" style={{ fontSize: 14 }}>Not a Better Auth app? Create it, then use Settings → Advanced.</span>
			</div>
		</form>
	);
}
