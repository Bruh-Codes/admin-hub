"use client";

import { useState } from "react";
import { hubClient } from "@/lib/hub/client";

export type Member = { id: string; role: string; userId: string; name: string; email: string; image: string | null };
export type Invite = { id: string; email: string; role: string; expiresAt: string };

const ROLES = [
	{ value: "member", label: "Member", help: "Read-only: can view users, organizations and sessions." },
	{ value: "admin", label: "Admin", help: "Can edit users, invite people and change settings." },
	{ value: "owner", label: "Owner", help: "Full control, including deleting the project." },
];

export function TeamClient(props: {
	projectId: string;
	myRole: string;
	myUserId: string;
	canManage: boolean;
	members: Member[];
	invites: Invite[];
	hubUrl: string;
}) {
	const { projectId, canManage } = props;
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
	// Only owners can hand out the owner role.
	const roleOptions = ROLES.filter((r) => r.value !== "owner" || props.myRole === "owner");

	async function run(action: () => Promise<{ error: { message?: string } | null }>, okText: string) {
		setBusy(true);
		setMsg(null);
		const { error } = await action();
		setBusy(false);
		if (error) return setMsg({ ok: false, text: error.message ?? "Something went wrong." });
		setMsg({ ok: true, text: okText });
		setTimeout(() => window.location.reload(), 700);
	}

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
					<span className="muted">{props.members.length} {props.members.length === 1 ? "member" : "members"}</span>
				</div>
				<div className="card list" style={{ marginTop: 16 }}>
					{props.members.map((m) => {
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

			{props.invites.length > 0 ? (
				<section style={{ marginTop: 40 }}>
					<h2>Pending invitations</h2>
					<div className="card list" style={{ marginTop: 16 }}>
						{props.invites.map((i) => (
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
