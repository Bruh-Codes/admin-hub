import { Invitations } from "@/components/invitations";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { hubOwners } from "@/lib/hub/auth";
import { pendingInvitesFor } from "@/lib/hub/invites";
import { listMemberships } from "@/lib/hub/projects";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/hub/session";

export const dynamic = "force-dynamic";

export default async function Projects() {
	const { user } = await requireUser();
	const [projects, invites] = await Promise.all([listMemberships(user.id), pendingInvitesFor(user.email)]);
	const canCreate = hubOwners().includes(user.email.toLowerCase());
	// A new owner starts on onboarding instead of an empty list.
	if (canCreate && projects.length === 0 && invites.length === 0) redirect("/projects/new");

	return (
		<>
			<header className="topbar">
				<a href="/projects" style={{ textDecoration: "none" }}><Logo /></a>
				<div style={{ flex: 1 }} />
				<UserMenu name={user.name} email={user.email} image={user.image} />
			</header>
			<main className="page">
				<div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
					<div>
						<h1>Projects</h1>
						<p className="muted" style={{ marginTop: 6 }}>Pick a project to manage its users.</p>
					</div>
					{canCreate ? <a className="btn btn-primary" href="/projects/new">New project</a> : null}
				</div>

				<Invitations invites={invites} />

				<section style={{ marginTop: 40 }}>
					{invites.length > 0 ? <h2 style={{ marginBottom: 16 }}>Your projects</h2> : null}
					{projects.length === 0 ? (
						<div className="card card-pad muted">
							{canCreate ? "No projects yet. Create one to connect a product's database." : "You're not in any project yet. Accept an invitation above, or ask a project admin to invite you."}
						</div>
					) : (
						<div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
							{projects.map((p) => (
								<a key={p.id} href={`/p/${p.slug}`} className="card card-pad project-card" style={{ textDecoration: "none" }}>
									<div className="row" style={{ gap: 14 }}>
										<span className="avatar" style={{ borderRadius: 10, width: 44, height: 44, fontSize: 18 }}>{p.name.slice(0, 1).toUpperCase()}</span>
										<div style={{ minWidth: 0 }}>
											<div style={{ fontWeight: 600, fontSize: 17 }}>{p.name}</div>
											<div className="muted mono" style={{ fontSize: 14 }}>{p.slug}</div>
										</div>
									</div>
									<div style={{ marginTop: 20 }}><span className="badge">{p.role}</span></div>
								</a>
							))}
						</div>
					)}
				</section>
			</main>
		</>
	);
}
