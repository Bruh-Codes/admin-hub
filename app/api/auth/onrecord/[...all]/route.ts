import { toNextJsHandler } from "better-auth/next-js";
import { AUTH_PATH, auth, googleEnabled } from "@/lib/products/onrecord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

/**
 * Only the two Google sign-in steps are exposed. Every other Better Auth
 * endpoint (sign-up, password reset, user updates, ...) stays closed, since
 * this instance talks to OnRecord's production database.
 */
function allowed(request: Request, method: "GET" | "POST"): boolean {
	if (!googleEnabled) return false;
	const path = new URL(request.url).pathname.slice(AUTH_PATH.length);
	if (method === "POST") return path === "/sign-in/social";
	return path === "/callback/google";
}

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

export async function GET(request: Request) {
	return allowed(request, "GET") ? authGet(request) : notFound();
}

export async function POST(request: Request) {
	if (!allowed(request, "POST")) return notFound();
	const body = await request.clone().json().catch(() => null);
	if (body?.provider !== "google") return notFound();
	return authPost(request);
}
