"use client";

import { useState } from "react";
import type { DEFAULT_CONNECTION, redactProjectConnection } from "@/lib/hub/connection";
import { PluginSteps } from "@/components/plugin-steps";
import { hubClient } from "@/lib/hub/client";

type Shape = typeof DEFAULT_CONNECTION;
type Redacted = ReturnType<typeof redactProjectConnection>;
type RedactedDb = Extract<Redacted, { kind: "database" }>;

const MODEL_LABELS: [keyof Shape["models"], string][] = [
	["user", "Users"],
	["session", "Sessions"],
	["account", "Accounts"],
	["verification", "Verifications"],
	["organization", "Organizations"],
	["member", "Members"],
	["invitation", "Invitations"],
];

export function SettingsClient(props: {
	slug: string;
	projectId: string;
	projectName: string;
	role: string;
	canManage: boolean;
	initial: Redacted | null;
	defaults: Shape;
	presets: Record<string, Shape>;
}) {
	const initialDb = props.initial?.kind === "database" ? (props.initial as RedactedDb) : null;
	const initialApp = props.initial?.kind === "app" ? props.initial : null;
	const start: Shape = initialDb ?? props.defaults;
	const [mode, setMode] = useState<"app" | "database">(initialDb ? "database" : "app");
	const [appUrl, setAppUrl] = useState(initialApp?.url ?? "");
	const [basePath, setBasePath] = useState(initialApp?.basePath ?? "/api/auth");
	const [appKey, setAppKey] = useState("");
	const [showPath, setShowPath] = useState(false);
	const [databaseUrl, setDatabaseUrl] = useState("");
	const [models, setModels] = useState(start.models);
	const [idStrategy, setIdStrategy] = useState(start.idStrategy);
	const [plugins, setPlugins] = useState(start.plugins);
	const [userFields, setUserFields] = useState(start.userFields.join(", "));
	const [roles, setRoles] = useState(start.roles.join(", "));
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
	const disabled = !props.canManage || busy;

	function applyPreset(p: Shape) {
		setModels(p.models);
		setIdStrategy(p.idStrategy);
		setPlugins(p.plugins);
		setUserFields(p.userFields.join(", "));
		setRoles(p.roles.join(", "));
		setMsg({ ok: true, text: "Preset applied. Add the database URL and save." });
	}

	async function save(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setMsg(null);
		const payload =
			mode === "app"
				? { kind: "app", url: appUrl, basePath, key: appKey }
				: { kind: "database", databaseUrl, models, idStrategy, plugins, userFields, roles };
		const res = await fetch(`/api/projects/${props.slug}/connection`, {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		});
		const data = await res.json().catch(() => ({}));
		setBusy(false);
		if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Could not save." });
		setDatabaseUrl("");
		setAppKey("");
		setMsg({ ok: true, text: `Connected. Found ${data.users} users. Open the Dashboard tab to see them.` });
	}

	async function deleteProject() {
		if (!window.confirm(`Delete ${props.projectName} from the hub? Its members lose access. The product's own database is not touched.`)) return;
		const { error } = await hubClient.organization.delete({ organizationId: props.projectId });
		if (error) return setMsg({ ok: false, text: error.message ?? "Could not delete." });
		window.location.href = "/projects";
	}

	return (
		<>
			{mode === "app" ? (
				<form onSubmit={save} className="card card-pad stack" style={{ gap: 24, marginTop: 32 }}>
					<div>
						<h2>Connect your app</h2>
						<p className="muted" style={{ marginTop: 6 }}>For apps built with Better Auth. Add the admin-hub plugin to the app once, then paste its URL and key here.</p>
					</div>
					<div>
						<label className="label" htmlFor="app-url">App URL</label>
						<input id="app-url" className="input" disabled={disabled} required placeholder="https://app.example.com" value={appUrl} onChange={(e) => setAppUrl(e.target.value)} />
						{showPath ? (
							<div style={{ marginTop: 12 }}>
								<label className="faint" htmlFor="app-path" style={{ fontSize: 14 }}>Better Auth path</label>
								<input id="app-path" className="input mono" disabled={disabled} value={basePath} onChange={(e) => setBasePath(e.target.value)} />
							</div>
						) : (
							<p className="hint">
								Auth routes at <span className="mono">{basePath}</span>.{" "}
								<button type="button" onClick={() => setShowPath(true)} style={{ background: "none", border: 0, color: "var(--text)", textDecoration: "underline", cursor: "pointer", font: "inherit", padding: 0 }}>Change</button>
							</p>
						)}
					</div>
					<div>
						<label className="label" htmlFor="app-key">Admin hub key</label>
						<input id="app-key" className="input mono" type="password" autoComplete="off" disabled={disabled} required={!initialApp} placeholder={initialApp ? "Saved. Leave empty to keep it." : "The app's ADMIN_HUB_KEY"} value={appKey} onChange={(e) => setAppKey(e.target.value)} />
					</div>
					<PluginSteps />
					{msg ? <p className={msg.ok ? "ok" : "error"}>{msg.text}</p> : null}
					{props.canManage ? (
						<div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
							<button className="btn btn-primary" disabled={busy}>{busy ? "Connecting…" : "Connect"}</button>
							<button type="button" className="btn btn-sm" onClick={() => { setMode("database"); setMsg(null); }}>Advanced: connect a database instead</button>
						</div>
					) : (
						<p className="muted">Only owners and admins can change these settings.</p>
					)}
				</form>
			) : (
			<form onSubmit={save} className="card card-pad stack" style={{ gap: 28, marginTop: 32 }}>
				<div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
					<h2>Database (advanced)</h2>
					{props.canManage ? (
						<span className="row" style={{ gap: 8 }}>
							<button type="button" className="btn btn-sm" onClick={() => applyPreset(props.presets.onrecord)}>Use OnRecord preset</button>
							<button type="button" className="btn btn-sm" onClick={() => { setMode("app"); setMsg(null); }}>Connect an app instead</button>
						</span>
					) : null}
				</div>
				<div>
					<label className="label" htmlFor="db">Postgres connection URL</label>
					<input
						id="db"
						className="input mono"
						type="password"
						autoComplete="off"
						disabled={disabled}
						placeholder={initialDb ? `Saved (${initialDb.databaseHost}). Leave empty to keep it.` : "postgresql://user:password@host:5432/db"}
						value={databaseUrl}
						onChange={(e) => setDatabaseUrl(e.target.value)}
					/>
					<p className="hint">Stored encrypted. Use the same database the product's Better Auth uses.</p>
				</div>

				<div>
					<div className="label">Table names</div>
					<div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
						{MODEL_LABELS.map(([k, label]) => (
							<div key={k}>
								<label className="faint" htmlFor={`m-${k}`} style={{ fontSize: 14 }}>{label}</label>
								<input id={`m-${k}`} className="input mono" disabled={disabled} value={models[k]} onChange={(e) => setModels({ ...models, [k]: e.target.value })} />
							</div>
						))}
					</div>
				</div>

				<div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
					<div>
						<label className="label" htmlFor="ids">User ids</label>
						<select id="ids" className="select" disabled={disabled} value={idStrategy} onChange={(e) => setIdStrategy(e.target.value as Shape["idStrategy"])}>
							<option value="default">Better Auth default</option>
							<option value="uuid">UUID (crypto.randomUUID)</option>
						</select>
					</div>
					<div>
						<label className="label" htmlFor="roles">User roles</label>
						<input id="roles" className="input mono" disabled={disabled} value={roles} onChange={(e) => setRoles(e.target.value)} />
						<p className="hint">First one is the default for new users.</p>
					</div>
					<div>
						<label className="label" htmlFor="fields">Extra user fields</label>
						<input id="fields" className="input mono" disabled={disabled} placeholder="none" value={userFields} onChange={(e) => setUserFields(e.target.value)} />
					</div>
				</div>

				<div>
					<div className="label">Plugins the product uses</div>
					<div className="row" style={{ gap: 24, flexWrap: "wrap" }}>
						{(["admin", "organization", "phoneNumber"] as const).map((p) => (
							<label key={p} className="row" style={{ gap: 10, fontSize: 15, cursor: "pointer" }}>
								<input type="checkbox" disabled={disabled} checked={plugins[p]} onChange={(e) => setPlugins({ ...plugins, [p]: e.target.checked })} style={{ width: 18, height: 18 }} />
								{p === "phoneNumber" ? "Phone number" : p[0].toUpperCase() + p.slice(1)}
							</label>
						))}
					</div>
				</div>

				{msg ? <p className={msg.ok ? "ok" : "error"}>{msg.text}</p> : null}
				{props.canManage ? (
					<div><button className="btn btn-primary" disabled={busy}>{busy ? "Testing connection…" : "Save and test"}</button></div>
				) : (
					<p className="muted">Only owners and admins can change these settings.</p>
				)}
			</form>
			)}

			{props.role === "owner" ? (
				<section className="card card-pad" style={{ marginTop: 32, borderColor: "#7f1d1d" }}>
					<h2>Delete project</h2>
					<p className="muted" style={{ marginTop: 6, marginBottom: 16 }}>Removes the project, its team and its saved connection from the hub. The product's database is not touched.</p>
					<button type="button" className="btn btn-danger" onClick={deleteProject}>Delete {props.projectName}</button>
				</section>
			) : null}
		</>
	);
}
