import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import { betterAuthStudio } from "better-auth-studio/nextjs";
import { Pool } from "pg";
import { BLOCKED_TOOLS, SESSION_SECONDS } from "../studio-defaults";
import type { ProductConnection } from "./connection";
import { projectSecret } from "./crypto";
import { getConnection, type Project } from "./projects";

/**
 * Builds (and caches) a Better Auth instance and studio handler for one
 * project's product database. Rebuilt when the project's connection changes.
 * The product instance is never exposed over HTTP: the studio uses it
 * server-side to read and manage records.
 */
type Entry = {
	version: number;
	handler: (request: Request) => Promise<Response>;
	pool: Pool;
	connection: ProductConnection;
};
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

export async function getProductStudio(project: Project): Promise<Entry | null> {
	const stored = await getConnection(project.id);
	if (!stored) return null;
	const version = stored.updatedAt.getTime();
	const existing = cache.get(project.id);
	if (existing && existing.version === version) return existing;
	if (existing) existing.pool.end().catch(() => {});

	const c = stored.connection;
	const pool = new Pool({
		connectionString: c.databaseUrl,
		max: 1,
		idleTimeoutMillis: 5_000,
		connectionTimeoutMillis: 5_000,
		allowExitOnIdle: true,
	});
	pool.on("error", (e) => console.error(`[project ${project.slug}] database connection closed`, e.message));
	const auth = buildAuth(project.id, c, pool);
	const handler = betterAuthStudio({
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
	const entry = { version, handler, pool, connection: c };
	cache.set(project.id, entry);
	return entry;
}
