import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { hubOwners } from "@/lib/hub/auth";
import { listMemberships } from "@/lib/hub/projects";
import { requireUser } from "@/lib/hub/session";

export const dynamic = "force-dynamic";

export default async function NewProjectChooser() {
	const { user } = await requireUser();
	if (!hubOwners().includes(user.email.toLowerCase())) redirect("/projects");
	const hasProjects = (await listMemberships(user.id)).length > 0;
	return (
		<>
			<header className="topbar">
				<a href="/projects" style={{ textDecoration: "none" }}><Logo /></a>
				<div style={{ flex: 1 }} />
				<UserMenu name={user.name} email={user.email} image={user.image} />
			</header>
			<main className="page" style={{ maxWidth: 1080 }}>
				{hasProjects ? <a href="/projects" className="muted" style={{ fontSize: 15 }}>← Projects</a> : null}
				<h1 style={{ marginTop: hasProjects ? 16 : 0, fontSize: 32 }}>{hasProjects ? "New project" : "Let's get you set up"}</h1>
				<p className="muted" style={{ marginTop: 8, fontSize: 17 }}>Connect a product to manage its users and team access from the hub.</p>

				<div className="choose">
					<a href="/projects/new/connect" className="card choose-card">
						<div className="choose-art mono" aria-hidden>
							<span className="faint">import</span> {"{ adminHub }"} <span className="faint">from</span> <span className="str">"./admin-hub"</span>{"\n\n"}
							plugins: [{"\n"}
							{"  "}adminHub({"{"} key: process.env.<span className="str">ADMIN_HUB_KEY</span> {"}"}),{"\n"}
							]
						</div>
						<div className="choose-body">
							<h2>Connect existing project</h2>
							<p className="muted">Already running Better Auth? Add one plugin and connect your app by its URL to manage users, sessions, organizations and roles.</p>
							<span className="choose-cta">Continue →</span>
						</div>
					</a>

					<div className="card choose-card" aria-disabled="true">
						<div className="choose-art mono" aria-hidden>
							<span className="faint">-- your own users table</span>{"\n"}
							users(id, email, name, role){"\n"}
							<span className="faint">-- mapped to the hub</span>
						</div>
						<div className="choose-body">
							<div className="row" style={{ gap: 10 }}><h2>Custom</h2><span className="badge">Coming soon</span></div>
							<p className="muted">For apps that don't use Better Auth: connect your own auth database and map its tables.</p>
							<span className="choose-cta faint">Not available yet</span>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
