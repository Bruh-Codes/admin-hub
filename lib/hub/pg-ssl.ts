/**
 * Hosted Postgres (Neon, Supabase, Railway...) requires SSL and resets
 * plain connections (ECONNRESET). Turn SSL on for any non-local host unless
 * the URL already says how (sslmode=... or ssl=...).
 */
export function sslFor(url: string): { ssl?: boolean } {
	try {
		const u = new URL(url);
		if (u.searchParams.has("sslmode") || u.searchParams.has("ssl")) return {};
		if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(u.hostname) || u.hostname === "") return {};
		return { ssl: true };
	} catch {
		return {};
	}
}
