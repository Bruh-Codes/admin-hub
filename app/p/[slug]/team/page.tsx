import { canManage } from "@/lib/hub/projects";
import { requireProject } from "@/lib/hub/session";
import { loadTeam } from "@/lib/hub/team";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function Team({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const { session, project } = await requireProject(slug);
	const team = await loadTeam(project.id);
	return (
		<main className="page">
			<h1>Team</h1>
			<p className="muted" style={{ marginTop: 6 }}>People who can open {project.name} in this hub, and what they can do.</p>
			<TeamClient
				slug={slug}
				projectId={project.id}
				myRole={project.role}
				myUserId={session.user.id}
				canManage={canManage(project.role)}
				initialTeam={team}
				hubUrl={process.env.HUB_URL ?? ""}
			/>
		</main>
	);
}
