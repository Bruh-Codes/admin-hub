import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hubAuth } from "./auth";
import { getMembership, type Membership } from "./projects";

/** Current hub session in a server component, or redirect to sign-in. */
export async function requireUser() {
	const session = await hubAuth.api.getSession({ headers: await headers() });
	if (!session) redirect("/");
	return session;
}

/** Current user's membership in a project, or 404-style redirect to the project list. */
export async function requireProject(slug: string): Promise<{ session: Awaited<ReturnType<typeof requireUser>>; project: Membership }> {
	const session = await requireUser();
	const project = await getMembership(session.user.id, slug);
	if (!project) redirect("/projects");
	return { session, project };
}
