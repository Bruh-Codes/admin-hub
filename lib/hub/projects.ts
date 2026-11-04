import { decrypt, encrypt } from "./crypto";
import { hubPool } from "./db";
import type { ProductConnection } from "./connection";

export type ProjectRole = "owner" | "admin" | "member";
export type Project = { id: string; name: string; slug: string; logo: string | null };
export type Membership = Project & { role: ProjectRole };

/** Projects the user belongs to, with their role in each. */
export async function listMemberships(userId: string): Promise<Membership[]> {
	const { rows } = await hubPool.query(
		`select o.id, o.name, o.slug, o.logo, m.role
		   from member m join organization o on o.id = m."organizationId"
		  where m."userId" = $1 order by o.name`,
		[userId],
	);
	return rows;
}

const memberCache = new Map<string, { at: number; value: Membership | null }>();

/** The user's membership in the project with this slug, or null. Cached for 30s. */
export async function getMembership(userId: string, slug: string): Promise<Membership | null> {
	const cacheKey = `${userId}:${slug}`;
	const hit = memberCache.get(cacheKey);
	if (hit && Date.now() - hit.at < 30_000) return hit.value;
	const { rows } = await hubPool.query(
		`select o.id, o.name, o.slug, o.logo, m.role
		   from member m join organization o on o.id = m."organizationId"
		  where m."userId" = $1 and o.slug = $2 limit 1`,
		[userId, slug],
	);
	const value = rows[0] ?? null;
	memberCache.set(cacheKey, { at: Date.now(), value });
	return value;
}

export function canManage(role: ProjectRole): boolean {
	return role === "owner" || role === "admin";
}

export type StoredConnection = { connection: ProductConnection; updatedAt: Date };

export async function getConnection(projectId: string): Promise<StoredConnection | null> {
	const { rows } = await hubPool.query(
		`select config, updated_at from hub_project_connection where project_id = $1`,
		[projectId],
	);
	if (!rows[0]) return null;
	return { connection: JSON.parse(decrypt(rows[0].config)), updatedAt: rows[0].updated_at };
}

export async function saveConnection(projectId: string, connection: ProductConnection): Promise<void> {
	await hubPool.query(
		`insert into hub_project_connection (project_id, config, updated_at) values ($1, $2, now())
		 on conflict (project_id) do update set config = excluded.config, updated_at = now()`,
		[projectId, encrypt(JSON.stringify(connection))],
	);
}
