import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import { betterAuthStudio } from "better-auth-studio/nextjs";
import { Pool } from "pg";
import { BLOCKED_TOOLS, SESSION_SECONDS } from "../studio-defaults";
import { isApp, type ProductConnection } from "./connection";
import { fetchSchema, remoteAdapter, rolesFrom, type AppConnection } from "./remote-app";
import { projectSecret } from "./crypto";
import { getConnection, type Project } from "./projects";

/**
 * Builds (and caches) a Better Auth instance and studio handler for one
 * project's product database. Rebuilt when the project's connection changes.
 * The product instance is never exposed over HTTP: the studio uses it
 * server-side to read and manage records.
 */
type Entry = {
	version: string;
	handler: (request: Request) => Promise<Response>;
	pool: Pool | null;
	/** The product's user roles, default first (for the role guard). */
	roles: string[];
};
/** Apps are re-asked for their schema at most this often. */
const APP_SCHEMA_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, Entry>();

export function studioBasePath(slug: string) {
	return `/p/${slug}/studio`;
}

function buildAuth(projectId: string, c: ProductConnection, pool: Pool) {
	const additionalFields = Object.fromEntries(
		c.userFields.map((f) => [f, { type: "string" as const, required: false, input: false }]),
	);
	const plugins: any[] = [];
	if (c.plugins.phoneNumber) {
		plugins.push(
			phoneNumber({
				sendOTP: () => {
					throw new Error("The admin hub does not send OTPs.");
				},
			}),
		);
	}
	if (c.plugins.organization) {
		plugins.push(
			organization({
				schema: {
					organization: { modelName: c.models.organization },
					member: { modelName: c.models.member },
					invitation: { modelName: c.models.invitation },
				},
			}),
		);
	}
	if (c.plugins.admin) {
		plugins.push(admin({ defaultRole: c.roles[0], adminRoles: c.roles.includes("admin") ? ["admin"] : [c.roles[0]] }));
	}
	return betterAuth({
		appName: "Product",
		database: pool,
		secret: projectSecret(projectId),
		// Never mounted; set so Better Auth does not warn about a missing URL.
		baseURL: process.env.HUB_URL,
		advanced: {
			database: {
				...(c.idStrategy === "uuid" ? { generateId: () => crypto.randomUUID() } : {}),
				validateSchema: false,
			},
		},
		// Sign-up and sign-in are never served for products; the hub has its own accounts.
		emailAndPassword: { enabled: true, disableSignUp: true },
		user: { modelName: c.models.user, additionalFields },
		session: { modelName: c.models.session },
		account: { modelName: c.models.account },
		verification: { modelName: c.models.verification },
		plugins,
	});
}

function buildAppAuth(projectId: string, c: AppConnection, schema: Awaited<ReturnType<typeof fetchSchema>>, roles: string[]) {
	const userTable = schema.models.user;
	const additionalFields = Object.fromEntries(
		schema.userFields
			.filter((f) => userTable?.fields[f])
			.map((f) => [f, { type: userTable.fields[f].type as "string", required: false, input: false }]),
	);
	const plugins: any[] = [];
	if (schema.plugins.includes("phone-number")) {
		plugins.push(phoneNumber({ sendOTP: () => { throw new Error("The admin hub does not send OTPs."); } }));
	}
	if (schema.plugins.includes("organization")) plugins.push(organization());
	if (schema.plugins.includes("admin")) {
		plugins.push(admin({ defaultRole: roles[0], adminRoles: schema.roles.admin.length ? schema.roles.admin : ["admin"] }));
	}
	return betterAuth({
		appName: schema.appName ?? "Product",
		// Model names stay Better Auth's own: the app's adapter maps them to its tables.
		database: remoteAdapter(c, schema),
		secret: projectSecret(projectId),
		baseURL: process.env.HUB_URL,
		advanced: { database: { generateId: false, validateSchema: false } },
		emailAndPassword: { enabled: true, disableSignUp: true },
		user: { additionalFields },
		plugins,
	});
}

function makeHandler(project: Project, auth: any) {
	return betterAuthStudio({
		auth,
		basePath: studioBasePath(project.slug),
		metadata: { title: project.name, theme: "dark" },
		access: {
			// The hub decides who gets in (project membership) and hands the
			// studio a session per request; see app/p/[slug]/studio.
			roles: ["hub"],
			secret: projectSecret(project.id),
			sessionDuration: SESSION_SECONDS,
		},
		tools: { exclude: BLOCKED_TOOLS },
	});
}

export async function getProductStudio(project: Project): Promise<Entry | null> {
	const stored = await getConnection(project.id);
	if (!stored) return null;
	const c = stored.connection;
	const existing = cache.get(project.id);
	const baseVersion = String(stored.updatedAt.getTime());

	if (isApp(c)) {
		const fresh = existing && existing.version.startsWith(`${baseVersion}:`) && Date.now() - Number(existing.version.split(":")[1]) < APP_SCHEMA_TTL_MS;
		if (fresh) return existing!;
		const schema = await fetchSchema(c);
		const roles = rolesFrom(schema);
		const entry: Entry = { version: `${baseVersion}:${Date.now()}`, handler: makeHandler(project, buildAppAuth(project.id, c, schema, roles)), pool: null, roles };
		cache.set(project.id, entry);
		return entry;
	}

	if (existing && existing.version === baseVersion) return existing;
	existing?.pool?.end().catch(() => {});
	const pool = new Pool({
		connectionString: c.databaseUrl,
		max: 1,
		idleTimeoutMillis: 5_000,
		connectionTimeoutMillis: 5_000,
		allowExitOnIdle: true,
	});
	pool.on("error", (e) => console.error(`[project ${project.slug}] database connection closed`, e.message));
	const entry: Entry = { version: baseVersion, handler: makeHandler(project, buildAuth(project.id, c, pool)), pool, roles: c.roles };
	cache.set(project.id, entry);
	return entry;
}
