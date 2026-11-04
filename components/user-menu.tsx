"use client";

import { useState } from "react";
import { hubClient } from "@/lib/hub/client";

export function UserMenu({ name, email, image }: { name: string; email: string; image?: string | null }) {
	const [open, setOpen] = useState(false);
	return (
		<div style={{ position: "relative" }}>
			<button type="button" className="row" onClick={() => setOpen(!open)} style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer", gap: 10, padding: 0 }} aria-expanded={open}>
				<span className="avatar" style={{ width: 36, height: 36 }}>
					{image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : name.slice(0, 1).toUpperCase()}
				</span>
			</button>
			{open ? (
				<div className="card" style={{ position: "absolute", right: 0, top: 46, width: 260, padding: 8, zIndex: 20, boxShadow: "0 12px 32px rgba(0,0,0,.5)" }}>
					<div style={{ padding: "10px 12px" }}>
						<div style={{ fontWeight: 600 }}>{name}</div>
						<div className="muted" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
					</div>
					<a href="/projects" className="menu-item">All projects</a>
					<button type="button" className="menu-item" onClick={async () => { await hubClient.signOut(); window.location.href = "/"; }}>
						Sign out
					</button>
				</div>
			) : null}
		</div>
	);
}
