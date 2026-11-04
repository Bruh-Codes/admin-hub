import { Client } from "pg";
import { hubAuth } from "@/lib/hub/auth";
import { parseConnection, redactConnection } from "@/lib/hub/connection";
import { canManage, getConnection, getMembership, saveConnection } from "@/lib/hub/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function manager(request: Request, slug: string) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	const project = session ? await getMembership(session.user.id, slug) : null;
	if (!project) return null;
	return { project, canManage: canManage(project.role) };
}

/** Connection settings without the password-bearing URL. */
export async function GET(request: Request, { params }: Ctx) {
	const access = await manager(request, (await params).slug);
	if (!access) return Response.json({ error: "Not found" }, { status: 404 });
	const stored = await getConnection(access.project.id);
	return Response.json({ connection: stored ? redactConnection(stored.connection) : null });
}

/**
 * Save connection settings (owners and admins). An empty databaseUrl keeps
 * the stored one. The connection is tested before it is saved: the user
 * table must exist and be readable.
 */
export async function PUT(request: Request, { params }: Ctx) {
	const access = await manager(request, (await params).slug);
	if (!access) return Response.json({ error: "Not found" }, { status: 404 });
	if (!access.canManage) return Response.json({ error: "Only owners and admins can change settings." }, { status: 403 });

	const body = await request.json().catch(() => ({}));
	if (!String(body.databaseUrl ?? "").trim()) {
		const stored = await getConnection(access.project.id);
		if (!stored) return Response.json({ error: "Enter the database URL." }, { status: 400 });
		body.databaseUrl = stored.connection.databaseUrl;
	}
	let connection;
	try {
		connection = parseConnection(body);
	} catch (e) {
		return Response.json({ error: (e as Error).message }, { status: 400 });
	}

	const client = new Client({ connectionString: connection.databaseUrl, connectionTimeoutMillis: 8_000 });
	try {
		await client.connect();
		const { rows } = await client.query(`select count(*)::int as n from "${connection.models.user}"`);
		await saveConnection(access.project.id, connection);
		return Response.json({ ok: true, users: rows[0].n });
	} catch (e) {
		return Response.json({ error: `Could not read the "${connection.models.user}" table: ${(e as Error).message}` }, { status: 400 });
	} finally {
		client.end().catch(() => {});
	}
}
