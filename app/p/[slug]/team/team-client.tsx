"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, queryKeys, unwrap } from "@/lib/client/api";
import { hubClient } from "@/lib/hub/client";
import type { Member, Team } from "@/lib/hub/team";

const ROLES = [
	{ value: "member", label: "Member", help: "Read-only: can view users, organizations and sessions." },
	{ value: "admin", label: "Admin", help: "Can edit users, invite people and change settings." },
	{ value: "owner", label: "Owner", help: "Full control, including deleting the project." },
];

export function TeamClient(props: {
	slug: string;
	projectId: string;
	myRole: string;
	myUserId: string;
	canManage: boolean;
	initialTeam: Team;
	hubUrl: string;
}) {
	const { projectId, canManage } = props;
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
	// Only owners can hand out the owner role.
	const roleOptions = ROLES.filter((r) => r.value !== "owner" || props.myRole === "owner");

	const qc = useQueryClient();
	const key = queryKeys.team(props.slug);
	const { data: team } = useQuery({
		queryKey: key,
		queryFn: () => api<Team>(`/api/projects/${props.slug}/team`),
		initialData: props.initialTeam,
	});

	// One mutation for every team change: run the Better Auth call, then refetch the team.
	const change = useMutation({
		mutationFn: ({ action }: { action: () => Promise<unknown>; okText: string }) => action(),
		onMutate: () => setMsg(null),
		onSuccess: (_d, { okText }) => {
			setMsg({ ok: true, text: okText });
			return qc.invalidateQueries({ queryKey: key });
		},
		onError: (e) => setMsg({ ok: false, text: e.message }),
	});
	const busy = change.isPending;
	function run(action: () => Promise<{ data: unknown; error: { message?: string } | null }>, okText: string) {
		change.mutate({ action: () => unwrap(action()), okText });
	}
	const members = team.members;
	const invites = team.invites;

	return (
		<>
			{canManage ? (
				<section className="card card-pad" style={{ marginTop: 32 }}>
					<h2>Invite people</h2>
					<p className="muted" style={{ marginTop: 6 }}>
						They sign in at <span className="mono" style={{ color: "var(--text)" }}>{props.hubUrl || "this hub"}</span> with Google using this email, then accept the invitation.
					</p>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							run(() => hubClient.organization.inviteMember({ email: email.trim().toLowerCase(), role: role as "member", organizationId: projectId }), `Invitation sent to ${email}.`);
						}}
						className="row"
						style={{ marginTop: 20, flexWrap: "wrap", alignItems: "flex-end" }}
					>
						<div style={{ flex: "2 1 260px" }}>
							<label className="label" htmlFor="invite-email">Email</label>
							<input id="invite-email" className="input" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>
						<div style={{ flex: "1 1 160px" }}>
							<label className="label" htmlFor="invite-role">Role</label>
							<select id="invite-role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
								{roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
							</select>
						</div>
						<button className="btn btn-primary" disabled={busy}>Send invite</button>
					</form>
					<p className="hint">{ROLES.find((r) => r.value === role)?.help}</p>
					{msg ? <p className={msg.ok ? "ok" : "error"} style={{ marginTop: 12 }}>{msg.text}</p> : null}
				</section>
			) : null}

			<section style={{ marginTop: 40 }}>
				<div className="row" style={{ justifyContent: "space-between" }}>
					<h2>Members</h2>
					<span className="muted">{members.length} {members.length === 1 ? "member" : "members"}</span>
				</div>
				<div className="card list" style={{ marginTop: 16 }}>
					{members.map((m) => {
						const isMe = m.userId === props.myUserId;
						const editable = canManage && !isMe && (m.role !== "owner" || props.myRole === "owner");
						return (
							<div key={m.id} className="row" style={{ padding: "16px 20px", justifyContent: "space-between", flexWrap: "wrap" }}>
								<div className="row" style={{ gap: 14, minWidth: 0 }}>
									<span className="avatar">{m.image ? <img src={m.image} alt="" referrerPolicy="no-referrer" /> : m.name.slice(0, 1).toUpperCase()}</span>
									<div style={{ minWidth: 0 }}>
										<div style={{ fontWeight: 600 }}>
											{m.name} {isMe ? <span className="faint" style={{ fontWeight: 400, fontSize: 14 }}>you</span> : null}
										</div>
										<div className="muted" style={{ fontSize: 15 }}>{m.email}</div>
									</div>
								</div>
								{editable ? (
									<div className="row" style={{ gap: 10 }}>
										<select
											className="select"
											style={{ width: 130, height: 38 }}
											value={m.role}
											disabled={busy}
											aria-label={`Role for ${m.name}`}
											onChange={(e) => run(() => hubClient.organization.updateMemberRole({ memberId: m.id, role: e.target.value as "member", organizationId: projectId }), `${m.name} is now ${e.target.value}.`)}
										>
											{roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
										</select>
										<button className="btn btn-sm btn-danger" disabled={busy} onClick={() => confirmRemove(m) && run(() => hubClient.organization.removeMember({ memberIdOrEmail: m.id, organizationId: projectId }), `${m.name} was removed.`)}>
											Remove
										</button>
									</div>
								) : (
									<span className="badge">{m.role}</span>
								)}
							</div>
						);
					})}
				</div>
			</section>

			{invites.length > 0 ? (
				<section style={{ marginTop: 40 }}>
					<h2>Pending invitations</h2>
					<div className="card list" style={{ marginTop: 16 }}>
						{invites.map((i) => (
							<div key={i.id} className="row" style={{ padding: "16px 20px", justifyContent: "space-between", flexWrap: "wrap" }}>
								<div>
									<div style={{ fontWeight: 500 }}>{i.email}</div>
									<div className="muted" style={{ fontSize: 15 }}>
										<span style={{ textTransform: "capitalize" }}>{i.role}</span> · expires {new Date(i.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
									</div>
								</div>
								{canManage ? (
									<button className="btn btn-sm" disabled={busy} onClick={() => run(() => hubClient.organization.cancelInvitation({ invitationId: i.id }), `Invitation to ${i.email} cancelled.`)}>
										Cancel
									</button>
								) : null}
							</div>
						))}
					</div>
				</section>
			) : null}
		</>
	);
}

function confirmRemove(m: Member): boolean {
	return window.confirm(`Remove ${m.name} (${m.email}) from this project?`);
}
