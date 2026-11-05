import { hubPool } from "@/lib/hub/db";

export type Member = { id: string; role: string; userId: string; name: string; email: string; image: string | null };
export type Invite = { id: string; email: string; role: string; expiresAt: string };
export type Team = { members: Member[]; invites: Invite[] };

/** Members and pending invitations of one project. */
export async function loadTeam(projectId: string): Promise<Team> {
	const [members, invites] = await Promise.all([
		hubPool.query<Member>(
			`select m.id, m.role, u.id as "userId", u.name, u.email, u.image
			   from member m join "user" u on u.id = m."userId"
			  where m."organizationId" = $1
			  order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end, u.name`,
			[projectId],
		),
		hubPool.query<{ id: string; email: string; role: string; expiresAt: Date }>(
			`select id, email, role, "expiresAt" from invitation
			  where "organizationId" = $1 and status = 'pending' and "expiresAt" > now()
			  order by "createdAt" desc`,
			[projectId],
		),
	]);
	return {
		members: members.rows,
		invites: invites.rows.map((i) => ({ ...i, expiresAt: new Date(i.expiresAt).toISOString() })),
	};
}
