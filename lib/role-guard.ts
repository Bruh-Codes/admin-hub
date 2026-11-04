/**
 * Guards the studio's write endpoints for one product before they reach the
 * database. The studio UI only knows Better Auth's generic roles
 * ("admin" / "user" / none); each product has its own, so role values are
 * checked and translated here.
 */
export type RoleRules = {
	/** Roles this product understands, e.g. ["owner", "reviewer", "admin"]. */
	roles: readonly string[];
	/** Role given when the studio sends "user" or no role on create. */
	defaultRole: string;
};

/** Studio endpoints that write fake data. Never allowed against real products. */
const SEED_PATH = /\/api\/(seed\/|users\/[^/]+\/seed-|organizations\/[^/]+\/seed-)/;
const USER_CREATE = /\/api\/users\/?$/;
const USER_UPDATE = /\/api\/users\/[^/]+\/?$/;

export async function guardStudioRequest(
	request: Request,
	basePath: string,
	rules: RoleRules,
): Promise<Request | Response> {
	const path = new URL(request.url).pathname.slice(basePath.length);
	if (SEED_PATH.test(path)) {
		return Response.json({ success: false, message: "Seeding is disabled on the admin hub." }, { status: 403 });
	}

	const isCreate = request.method === "POST" && USER_CREATE.test(path);
	const isUpdate = request.method === "PUT" && USER_UPDATE.test(path);
	if (!isCreate && !isUpdate) return request;

	const body = await request.clone().json().catch(() => null);
	if (!body || typeof body !== "object") return request;

	const raw = typeof body.role === "string" ? body.role.trim().toLowerCase() : body.role;
	if (raw === "user" || ((raw === null || raw === undefined || raw === "") && isCreate)) {
		body.role = rules.defaultRole;
	} else if (raw === null || raw === undefined || raw === "") {
		delete body.role; // an edit without a role leaves the role alone
	} else if (rules.roles.includes(raw)) {
		body.role = raw;
	} else {
		return Response.json(
			{ success: false, error: `Role must be one of: ${rules.roles.join(", ")}.`, message: `Role must be one of: ${rules.roles.join(", ")}.` },
			{ status: 400 },
		);
	}
	// The studio ignores a password on create; people set their own (Google or reset).
	if (isCreate) delete body.password;

	const headers = new Headers(request.headers);
	headers.delete("content-length");
	return new Request(request.url, { method: request.method, headers, body: JSON.stringify(body) });
}
