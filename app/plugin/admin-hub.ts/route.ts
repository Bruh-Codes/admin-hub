import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Serves the admin-hub Better Auth plugin source so apps can install it with
 * one curl command. Public on purpose: it holds no secrets.
 */
export async function GET() {
	const source = await readFile(join(process.cwd(), "plugin", "admin-hub.ts"), "utf8");
	return new Response(source, {
		headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
	});
}
