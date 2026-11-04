"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: string; email: string; name: string; role: string | null };

const box = { background: "#111", color: "#fafafa", border: "1px solid #333", padding: "8px 10px", font: "inherit" } as const;

/** Talks to the studio's own user API, so the studio sign-in and the hub's role guard apply. */
export function TeamManager({ basePath, roles, defaultRole }: { basePath: string; roles: string[]; defaultRole: string }) {
	const [users, setUsers] = useState<User[] | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [signedOut, setSignedOut] = useState(false);
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [role, setRole] = useState(roles.includes("admin") ? "admin" : defaultRole);

	const load = useCallback(async () => {
		const res = await fetch(`${basePath}/api/users?limit=10000`, { credentials: "include" });
		if (res.status === 401) return setSignedOut(true);
		const data = await res.json();
		setUsers(data.users ?? []);
	}, [basePath]);

	useEffect(() => {
		load().catch(() => setStatus("Could not load users."));
	}, [load]);

	async function save(target: { id?: string; email: string; name: string }, newRole: string) {
		setStatus("Saving…");
		const res = target.id
			? await fetch(`${basePath}/api/users/${target.id}`, {
					method: "PUT",
					credentials: "include",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ role: newRole }),
				})
			: await fetch(`${basePath}/api/users`, {
					method: "POST",
					credentials: "include",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ email: target.email, name: target.name || target.email.split("@")[0], role: newRole, emailVerified: false }),
				});
		const data = await res.json().catch(() => null);
		if (!res.ok || data?.success === false) {
			setStatus(data?.message || data?.error || "Save failed.");
			return;
		}
		setStatus(`${target.email} is now ${newRole}.`);
		await load();
	}

	async function onAdd(e: React.FormEvent) {
		e.preventDefault();
		const clean = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setStatus("Enter a valid email.");
		const existing = users?.find((u) => u.email.toLowerCase() === clean);
		await save(existing ?? { email: clean, name: name.trim() }, role);
		setEmail("");
		setName("");
	}

	if (signedOut) {
		return (
			<p>
				Sign in first: <a href={basePath} style={{ color: "#fafafa" }}>open the dashboard</a>, then come back.
			</p>
		);
	}

	const staff = (users ?? []).filter((u) => u.role && u.role !== defaultRole);

	return (
		<>
			<form onSubmit={onAdd} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "24px 0" }}>
				<input style={{ ...box, flex: "2 1 220px" }} type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
				<input style={{ ...box, flex: "1 1 140px" }} placeholder="Name (new people)" value={name} onChange={(e) => setName(e.target.value)} />
				<select style={box} value={role} onChange={(e) => setRole(e.target.value)}>
					{roles.map((r) => (
						<option key={r} value={r}>{r}</option>
					))}
				</select>
				<button type="submit" style={{ ...box, background: "#fafafa", color: "#0a0a0a", cursor: "pointer" }}>Add or update</button>
			</form>
			{status ? <p style={{ color: "#a3a3a3" }}>{status}</p> : null}
			<h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 32 }}>People with a role other than {defaultRole}</h2>
			{users === null ? (
				<p style={{ color: "#a3a3a3" }}>Loading…</p>
			) : staff.length === 0 ? (
				<p style={{ color: "#a3a3a3" }}>None yet.</p>
			) : (
				<ul style={{ listStyle: "none", padding: 0 }}>
					{staff.map((u) => (
						<li key={u.id} style={{ borderTop: "1px solid #262626", padding: "12px 0", display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
							<span>
								{u.name} <span style={{ color: "#a3a3a3" }}>{u.email}</span>
							</span>
							<select style={box} value={u.role ?? ""} onChange={(e) => save(u, e.target.value)}>
								{roles.map((r) => (
									<option key={r} value={r}>{r}</option>
								))}
							</select>
						</li>
					))}
				</ul>
			)}
		</>
	);
}
