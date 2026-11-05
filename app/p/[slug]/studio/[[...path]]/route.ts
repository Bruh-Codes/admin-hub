import { hubAuth } from "@/lib/hub/auth";
import { projectSecret } from "@/lib/hub/crypto";
import { getProductStudio, studioBasePath } from "@/lib/hub/product-studio";
import { getMembership } from "@/lib/hub/projects";
import { mintStudioSession, withStudioCookie } from "@/lib/hub/studio-session";
import { guardStudioRequest } from "@/lib/role-guard";
import { STUDIO_THEME } from "@/lib/studio-theme";
import { fixAnalytics } from "@/lib/hub/analytics-fix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Every studio request passes through here:
 * 1. hub session + project membership (otherwise 401 / back to sign-in),
 * 2. members (not owner/admin) are read-only,
 * 3. role guard for product user writes and blocked seed endpoints,
 * 4. a fresh studio session is put on the request, so the studio's own
 *    login page is never needed.
 */
async function handle(request: Request, { params }: Ctx): Promise<Response> {
	const { slug } = await params;
	const url = new URL(request.url);
	const isPage = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");

	const session = await hubAuth.api.getSession({ headers: request.headers });
	const project = session ? await getMembership(session.user.id, slug) : null;
	if (!session || !project) {
		return isPage
			? Response.redirect(new URL("/", url), 302)
			: Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const basePath = studioBasePath(slug);
	const subPath = url.pathname.slice(basePath.length) || "/";

	// The studio's own sign-in/sign-out screens: send the whole window to the hub instead.
	if (subPath === "/login" || subPath === "/access-denied" || subPath.startsWith("/api/auth/logout")) {
		if (!isPage) return Response.json({ success: true });
		return new Response(`<!doctype html><script>window.top.location.href="/p/${slug}"</script>`, {
			headers: { "content-type": "text/html" },
		});
	}

	if (request.method !== "GET" && request.method !== "HEAD" && project.role === "member") {
		return Response.json(
			{ success: false, error: "Read-only access", message: "Members have read-only access. Ask a project admin." },
			{ status: 403 },
		);
	}

	let studio;
	try {
		studio = await getProductStudio(project);
	} catch (e) {
		const message = `Could not reach ${project.name}: ${(e as Error).message}`;
		return isPage
			? new Response(`<!doctype html><body style="background:#0a0a0a;color:#fafafa;font:16px system-ui;padding:48px">${message.replace(/</g, "&lt;")}</body>`, { status: 502, headers: { "content-type": "text/html" } })
			: Response.json({ error: message }, { status: 502 });
	}
	if (!studio) {
		return isPage
			? Response.redirect(new URL(`/p/${slug}/settings`, url), 302)
			: Response.json({ error: "Project database not connected" }, { status: 409 });
	}

	const guarded = await guardStudioRequest(request, basePath, {
		roles: studio.roles,
		defaultRole: studio.roles[0],
	});
	if (guarded instanceof Response) return guarded;

	const headers = new Headers(guarded.headers);
	headers.set(
		"cookie",
		withStudioCookie(headers.get("cookie"), mintStudioSession(session.user, projectSecret(project.id))),
	);
	const response = await studio.handler(
		new Request(guarded.url, {
			method: guarded.method,
			headers,
			body: guarded.method === "GET" || guarded.method === "HEAD" ? undefined : await guarded.arrayBuffer(),
		}),
	);

	// Real period-over-period ▲/▼ numbers instead of the studio's hour-vs-hour ones.
	if ((subPath === "/analytics" || subPath === "/api/analytics") && guarded.method === "GET" && response.ok) {
		const body = await response.json().catch(() => null);
		if (body) {
			const fetchTotal = async (type: string, from: Date, to: Date) => {
				const u = new URL(guarded.url);
				u.search = new URLSearchParams({ type, period: "Custom", from: from.toISOString(), to: to.toISOString() }).toString();
				const r = await studio.handler(new Request(u, { method: "GET", headers }));
				return Number((await r.json().catch(() => ({}))).total ?? 0);
			};
			return Response.json(await fixAnalytics(new URL(guarded.url), body, fetchTotal), { headers: { "cache-control": "no-store" } });
		}
	}

	// Drop the studio's own session cookie; the hub mints one per request.
	const out = new Headers(response.headers);
	out.delete("set-cookie");
	if ((out.get("content-type") ?? "").includes("text/html")) {
		const html = (await response.text()).replace("</head>", `${STUDIO_THEME}</head>`);
		out.delete("content-length");
		out.delete("content-encoding");
		out.set("cache-control", "no-store");
		return new Response(html, { status: response.status, headers: out });
	}
	return new Response(response.body, { status: response.status, headers: out });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
