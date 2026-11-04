import { hubAuth, hubOwners } from "@/lib/hub/auth";
import { parseAppConnection } from "@/lib/hub/connection";
import { fetchSchema } from "@/lib/hub/remote-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Check an app URL + key before a project is created (hub owners only). */
export async function POST(request: Request) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	if (!session || !hubOwners().includes(session.user.email.toLowerCase())) {
		return Response.json({ error: "Not allowed" }, { status: 403 });
	}
	try {
		const connection = parseAppConnection(await request.json().catch(() => ({})));
		const schema = await fetchSchema(connection);
		return Response.json({ ok: true, appName: schema.appName, plugins: schema.plugins.filter((p) => p !== "admin-hub") });
	} catch (e) {
		return Response.json({ error: (e as Error).message }, { status: 400 });
	}
}
