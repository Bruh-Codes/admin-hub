import { hubAuth, hubOwners } from "@/lib/hub/auth";
import { parseAppConnection } from "@/lib/hub/connection";
import { encrypt } from "@/lib/hub/crypto";
import { hubPool } from "@/lib/hub/db";
import { saveConnection } from "@/lib/hub/projects";
import { fetchSchema } from "@/lib/hub/remote-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/**
 * Create a project together with its app connection (hub owners only).
 * All or nothing: the app is checked and the hub's encryption is checked
 * before the project exists, and if saving the connection still fails the
 * new project is removed again.
 */
export async function POST(request: Request) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	if (!session || !hubOwners().includes(session.user.email.toLowerCase())) return fail("Not allowed", 403);

	const body = await request.json().catch(() => ({}));
	const name = String(body.name ?? "").trim();
	const slug = String(body.slug ?? "").trim();
	if (!name || !/^[a-z0-9-]{1,40}$/.test(slug)) return fail("Enter a project name.");

	let connection;
	try {
		connection = parseAppConnection(body.connection ?? {});
		await fetchSchema(connection);
		const res = await fetch(`${connection.url}${connection.basePath}/admin-hub/rpc`, {
			method: "POST",
			headers: { "content-type": "application/json", "x-admin-hub-key": connection.key },
			body: JSON.stringify({ op: "count", args: { model: "user" } }),
			signal: AbortSignal.timeout(15_000),
		});
		if (!res.ok) throw new Error(`The app couldn't read its users (HTTP ${res.status}).`);
	} catch (e) {
		return fail((e as Error).message);
	}
	try {
		encrypt("check");
	} catch (e) {
		return fail(`The hub can't store connections: ${(e as Error).message}`, 500);
	}

	let projectId: string;
	try {
		const org = await hubAuth.api.createOrganization({ body: { name, slug, keepCurrentActiveOrganization: true }, headers: request.headers });
		if (!org) throw new Error("Could not create the project.");
		projectId = org.id;
	} catch (e) {
		const msg = (e as Error).message;
		return fail(/slug|already exists/i.test(msg) ? "A project with that name already exists." : msg);
	}

	try {
		await saveConnection(projectId, connection);
	} catch (e) {
		await hubPool.query(`delete from organization where id = $1`, [projectId]).catch((err) =>
			console.error("[hub] could not roll back project", projectId, err),
		);
		return fail(`Couldn't save the connection, so the project was not created: ${(e as Error).message}`, 500);
	}
	return Response.json({ ok: true, slug });
}
