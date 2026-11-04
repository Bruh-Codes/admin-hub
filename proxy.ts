import { NextResponse, type NextRequest } from "next/server";

/**
 * Outer gate for the whole hub: HTTP Basic Auth with one shared hub
 * password, checked before any studio code runs. Each product then asks for
 * its own admin sign-in. Fails closed: with no password configured, every
 * request is refused.
 */
export function proxy(request: NextRequest) {
	const user = process.env.HUB_BASIC_USER;
	const password = process.env.HUB_BASIC_PASSWORD;
	if (!user || !password) {
		return new NextResponse("Admin hub is not configured.", { status: 503 });
	}

	const header = request.headers.get("authorization") ?? "";
	if (header.startsWith("Basic ")) {
		const decoded = atob(header.slice(6));
		const split = decoded.indexOf(":");
		if (split > 0 && safeEqual(decoded.slice(0, split), user) && safeEqual(decoded.slice(split + 1), password)) {
			return NextResponse.next();
		}
	}

	return new NextResponse("Authentication required.", {
		status: 401,
		headers: { "WWW-Authenticate": 'Basic realm="Admin hub", charset="UTF-8"' },
	});
}

function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export const config = { matcher: "/:path*" };
