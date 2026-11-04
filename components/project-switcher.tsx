"use client";

import { useState } from "react";

type P = { slug: string; name: string; role: string };

export function ProjectSwitcher({ current, projects, canCreate }: { current: P; projects: P[]; canCreate: boolean }) {
	const [open, setOpen] = useState(false);
	return (
		<div style={{ position: "relative" }}>
			<button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="row" style={{ gap: 10, background: "none", border: "1px solid transparent", borderRadius: 8, color: "inherit", font: "inherit", cursor: "pointer", padding: "6px 10px" }}>
				<span className="avatar" style={{ width: 28, height: 28, borderRadius: 7, fontSize: 14 }}>{current.name.slice(0, 1).toUpperCase()}</span>
				<span style={{ fontWeight: 600, fontSize: 16 }}>{current.name}</span>
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ color: "var(--muted)" }}><path d="M5 6l3-3 3 3M5 10l3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.5" /></svg>
			</button>
			{open ? (
				<div className="card" style={{ position: "absolute", left: 0, top: 48, width: 300, padding: 8, zIndex: 30, boxShadow: "0 12px 32px rgba(0,0,0,.5)" }}>
					<div className="faint" style={{ fontSize: 13, fontWeight: 500, padding: "8px 12px", textTransform: "uppercase", letterSpacing: ".04em" }}>Projects</div>
					{projects.map((p) => (
						<a key={p.slug} href={`/p/${p.slug}`} className="menu-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span className="row" style={{ gap: 10 }}>
								<span className="avatar" style={{ width: 28, height: 28, borderRadius: 7, fontSize: 14 }}>{p.name.slice(0, 1).toUpperCase()}</span>
								<span>
									<span style={{ display: "block", fontWeight: 500 }}>{p.name}</span>
									<span className="faint" style={{ display: "block", fontSize: 13, textTransform: "capitalize" }}>{p.role}</span>
								</span>
							</span>
							{p.slug === current.slug ? <span className="ok">✓</span> : null}
						</a>
					))}
					<div style={{ borderTop: "1px solid var(--line)", margin: "6px 0" }} />
					<a href="/projects" className="menu-item">All projects</a>
					{canCreate ? <a href="/projects/new" className="menu-item">+ New project</a> : null}
				</div>
			) : null}
		</div>
	);
}
