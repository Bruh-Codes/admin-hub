import { hubPool } from "@/lib/hub/db";
import { canManage } from "@/lib/hub/projects";
import { requireProject } from "@/lib/hub/session";
import { TeamClient, type Invite, type Member } from "./team-client";

export const dynamic = "force-dynamic";

export default async function Team({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const { session, project } = await requireProject(slug);
	const [members, invites] = await Promise.all([
		hubPool.query<Member>(
			`select m.id, m.role, u.id as "userId", u.name, u.email, u.image
			   from member m join "user" u on u.id = m."userId"
			  where m."organizationId" = $1
			  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, u.name`,
			[project.id],
		),
		hubPool.query<Invite>(
			`select id, email, role, "expiresAt" from invitation
			  where "organizationId" = $1 and status = 'pending' and "expiresAt" > now()
			  order by "createdAt" desc`,
			[project.id],
		),
	]);
	return (
		<main className="page">
			<h1>Team</h1>
			<p className="muted" style={{ marginTop: 6 }}>People who can open {project.name} in this hub, and what they can do.</p>
			<TeamClient
				projectId={project.id}
				myRole={project.role}
				myUserId={session.user.id}
				canManage={canManage(project.role)}
				members={members.rows}
				invites={invites.rows.map((i) => ({ ...i, expiresAt: new Date(i.expiresAt).toISOString() }))}
				hubUrl={process.env.HUB_URL ?? ""}
			/>
		</main>
	);
}
