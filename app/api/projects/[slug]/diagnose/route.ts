import { hubAuth } from "@/lib/hub/auth";
import { isApp } from "@/lib/hub/connection";
import { canManage, getConnection, getMembership } from "@/lib/hub/projects";
import { buildStudioAuthForDiagnose } from "@/lib/hub/product-studio";
import { fetchSchema, remoteAdapter } from "@/lib/hub/remote-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owners/admins: run the studio's basic reads against the app and report each result or error. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	const project = session ? await getMembership(session.user.id, (await params).slug) : null;
	if (!project || !canManage(project.role)) return Response.json({ error: "Not found" }, { status: 404 });
	const stored = await getConnection(project.id);
	if (!stored || !isApp(stored.connection)) return Response.json({ error: "Not connected by app URL" }, { status: 400 });
	const c = stored.connection;
	const out: Record<string, unknown> = { url: c.url, basePath: c.basePath };
	const step = async (name: string, fn: () => Promise<unknown>) => {
		const t = Date.now();
		try {
			const v = await fn();
			out[name] = { ok: true, ms: Date.now() - t, value: Array.isArray(v) ? `${v.length} rows` : v };
		} catch (e) {
			out[name] = { ok: false, ms: Date.now() - t, error: (e as Error).message, stack: (e as Error).stack?.split("\n").slice(0, 4) };
		}
	};
	let schema: Awaited<ReturnType<typeof fetchSchema>> | null = null;
	await step("schema", async () => {
		schema = await fetchSchema(c);
		return { plugins: schema.plugins, models: Object.keys(schema.models) };
	});
	if (schema) {
		const db = remoteAdapter(c, schema)();
		await step("countUsers", () => db.count({ model: "user" }));
		await step("findUsers", () => db.findMany({ model: "user", limit: 100000 }));
		await step("findSessions", () => db.findMany({ model: "session", limit: 100000 }));
		await step("findOrgs", () => db.findMany({ model: "organization", limit: 100000 }));
		await step("studioAuth", async () => {
			const ctx = await buildStudioAuthForDiagnose(project.id, c, schema!).$context;
			const users = await ctx.adapter.findMany({ model: "user", limit: 100000 });
			return `${users.length} users via the studio's auth`;
		});
	}
	return Response.json(out);
}
