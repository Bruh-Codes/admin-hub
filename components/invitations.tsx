"use client";

import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/client/api";
import { hubClient } from "@/lib/hub/client";

export type PendingInvite = { id: string; projectName: string; role: string; inviterName: string | null };

export function Invitations({ invites }: { invites: PendingInvite[] }) {
	const respond = useMutation({
		mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
			unwrap<unknown>(
				accept
					? hubClient.organization.acceptInvitation({ invitationId: id })
					: hubClient.organization.rejectInvitation({ invitationId: id }),
			),
		// The project list is rendered on the server, so reload to show the new project.
		onSuccess: () => window.location.reload(),
	});
	const busy = respond.isPending || respond.isSuccess ? respond.variables?.id : null;
	const error = respond.error?.message ?? null;
	const act = (id: string, accept: boolean) => respond.mutate({ id, accept });

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
