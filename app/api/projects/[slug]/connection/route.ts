import { Client } from "pg";
import { hubAuth } from "@/lib/hub/auth";
import { isApp, parseAppConnection, parseConnection, redactProjectConnection } from "@/lib/hub/connection";
import { canManage, getConnection, getMembership, saveConnection } from "@/lib/hub/projects";
import { countUsers, fetchSchema } from "@/lib/hub/remote-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function access(request: Request, slug: string) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	const project = session ? await getMembership(session.user.id, slug) : null;
	return project ? { project, canManage: canManage(project.role) } : null;
}

/** Connection settings without the key or database password. */
export async function GET(request: Request, { params }: Ctx) {
	const a = await access(request, (await params).slug);
	if (!a) return Response.json({ error: "Not found" }, { status: 404 });
	const stored = await getConnection(a.project.id);
	return Response.json({ connection: stored ? redactProjectConnection(stored.connection) : null });
}

/**
 * Save the connection (owners and admins). It is tested before saving:
 * an app must answer the admin-hub schema call with this key; a database
 * must have a readable user table. An empty key / URL keeps the stored one.
 */
export async function PUT(request: Request, { params }: Ctx) {
	const a = await access(request, (await params).slug);
	if (!a) return Response.json({ error: "Not found" }, { status: 404 });
	if (!a.canManage) return Response.json({ error: "Only owners and admins can change settings." }, { status: 403 });

	const body = await request.json().catch(() => ({}));
	const stored = await getConnection(a.project.id);

	if (body.kind === "app") {
		if (!String(body.key ?? "").trim() && stored && isApp(stored.connection)) body.key = stored.connection.key;
		let connection;
		try {
			connection = parseAppConnection(body);
			const schema = await fetchSchema(connection);
			const users = await countUsers(connection);
			await saveConnection(a.project.id, connection);
			return Response.json({ ok: true, users, plugins: schema.plugins, appName: schema.appName });
		} catch (e) {
			return Response.json({ error: (e as Error).message }, { status: 400 });
		}
	}

	if (!String(body.databaseUrl ?? "").trim()) {
		if (!stored || isApp(stored.connection)) return Response.json({ error: "Enter the database URL." }, { status: 400 });
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
		await saveConnection(a.project.id, { ...connection, kind: "database" });
		return Response.json({ ok: true, users: rows[0].n });
	} catch (e) {
		return Response.json({ error: `Could not read the "${connection.models.user}" table: ${(e as Error).message}` }, { status: 400 });
	} finally {
		client.end().catch(() => {});
	}
}
