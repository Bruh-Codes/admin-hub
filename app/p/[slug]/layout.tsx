import { Logo } from "@/components/logo";
import { ProjectSwitcher } from "@/components/project-switcher";
import { ProjectTabs } from "@/components/project-tabs";
import { StudioActions } from "@/components/studio-actions";
import { UserMenu } from "@/components/user-menu";
import { hubOwners } from "@/lib/hub/auth";
import { listMemberships } from "@/lib/hub/projects";
import { requireProject } from "@/lib/hub/session";

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const { session, project } = await requireProject(slug);
	const projects = await listMemberships(session.user.id);
	return (
		<div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
			<header className="topbar">
				<a href="/projects" style={{ textDecoration: "none" }} aria-label="All projects" className="hide-sm"><Logo /></a>
				<span className="divider hide-sm">/</span>
				<ProjectSwitcher current={project} projects={projects} canCreate={hubOwners().includes(session.user.email.toLowerCase())} />
				<ProjectTabs slug={slug} />
				<div style={{ flex: 1 }} />
				<StudioActions slug={slug} />
				<UserMenu name={session.user.name} email={session.user.email} image={session.user.image} />
			</header>
			<div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
		</div>
	);
}
