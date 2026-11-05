import { hubAuth } from "@/lib/hub/auth";
import { getMembership } from "@/lib/hub/projects";
import { loadTeam } from "@/lib/hub/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Members and pending invitations, for any member of the project. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const session = await hubAuth.api.getSession({ headers: request.headers });
	const project = session ? await getMembership(session.user.id, (await params).slug) : null;
	if (!project) return Response.json({ error: "Not found" }, { status: 404 });
	return Response.json(await loadTeam(project.id));
}
