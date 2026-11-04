"use client";

import { useState } from "react";
import { hubClient } from "@/lib/hub/client";

export type PendingInvite = { id: string; projectName: string; role: string; inviterName: string | null };

export function Invitations({ invites }: { invites: PendingInvite[] }) {
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function act(id: string, accept: boolean) {
		setBusy(id);
		setError(null);
		const { error } = accept
			? await hubClient.organization.acceptInvitation({ invitationId: id })
			: await hubClient.organization.rejectInvitation({ invitationId: id });
		if (error) {
			setError(error.message ?? "Something went wrong.");
			setBusy(null);
			return;
		}
		window.location.reload();
	}

	if (invites.length === 0) return null;
	return (
		<section style={{ marginTop: 40 }}>
			<h2>Invitations</h2>
			<div className="card list" style={{ marginTop: 16 }}>
				{invites.map((i) => (
					<div key={i.id} className="row" style={{ padding: "18px 20px", justifyContent: "space-between", flexWrap: "wrap" }}>
						<div>
							<div style={{ fontWeight: 600, fontSize: 17 }}>{i.projectName}</div>
							<div className="muted" style={{ fontSize: 15 }}>
								{i.inviterName ? `${i.inviterName} invited you` : "You were invited"} as <span style={{ textTransform: "capitalize" }}>{i.role}</span>
							</div>
						</div>
						<div className="row" style={{ gap: 10 }}>
							<button className="btn btn-sm" disabled={busy === i.id} onClick={() => act(i.id, false)}>Decline</button>
							<button className="btn btn-sm btn-primary" disabled={busy === i.id} onClick={() => act(i.id, true)}>Accept</button>
						</div>
					</div>
				))}
			</div>
			{error ? <p className="error" style={{ marginTop: 12 }}>{error}</p> : null}
		</section>
	);
}
