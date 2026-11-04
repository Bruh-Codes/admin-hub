"use client";

import { useState } from "react";
import { hubClient } from "@/lib/hub/client";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function NewProjectForm() {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [touched, setTouched] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const { error } = await hubClient.organization.create({ name: name.trim(), slug, keepCurrentActiveOrganization: true });
		if (error) {
			setError(error.message ?? "Could not create the project.");
			setBusy(false);
			return;
		}
		window.location.href = `/p/${slug}/settings?new=1`;
	}

	return (
		<form onSubmit={submit} className="card card-pad stack" style={{ gap: 20 }}>
			<div>
				<label className="label" htmlFor="name">Name</label>
				<input id="name" className="input" value={name} required placeholder="OnRecord" onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }} />
			</div>
			<div>
				<label className="label" htmlFor="slug">URL</label>
				<input id="slug" className="input mono" value={slug} required pattern="[a-z0-9-]+" onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} />
				<p className="hint">Your project lives at /p/{slug || "…"}</p>
			</div>
			{error ? <p className="error">{error}</p> : null}
			<div><button className="btn btn-primary" disabled={busy || !name || !slug}>{busy ? "Creating…" : "Create project"}</button></div>
		</form>
	);
}
