import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import type { StudioConfig } from "better-auth-studio";
import { Pool } from "pg";
import { requireEnv, requireList } from "../env";
import type { RoleRules } from "../role-guard";
import { BLOCKED_TOOLS, SESSION_SECONDS } from "../studio-defaults";

/**
 * OnRecord's Better Auth schema, mirrored from apps/web/lib/auth.ts in
 * Bruh-Codes/Onrecord. Keep the model names, id generator and extra fields in
 * step with that file: if they drift, the studio reads or writes the wrong
 * tables or creates users whose ids apps/api cannot parse.
 *
 * Deliberately left out: emails, SMS, the jwt plugin and nextCookies. Google
 * is only used to sign admins into the hub (see app/api/auth/onrecord); the
 * hub never signs users into OnRecord itself and never creates users.
 */
export const BASE_PATH = "/onrecord";
/** Where this product's Better Auth routes live on the hub (Google sign-in only). */
export const AUTH_PATH = "/api/auth/onrecord";

/** OnRecord's roles (apps/api Role enum). "owner" is the everyday user. */
export const ROLE_RULES: RoleRules = {
	roles: ["owner", "reviewer", "admin"],
	defaultRole: "owner",
};

const googleClientId = process.env.ONRECORD_GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.ONRECORD_GOOGLE_CLIENT_SECRET?.trim();
/** Google sign-in is offered only when both credentials are set. */
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

const pool = new Pool({
	connectionString: requireEnv("ONRECORD_DATABASE_URL"),
	// Railway's public TCP proxy retires idle sockets; keep one short-lived
	// connection per function instance, same as the OnRecord web app.
	max: 1,
	idleTimeoutMillis: 5_000,
	connectionTimeoutMillis: 5_000,
	allowExitOnIdle: true,
});
pool.on("error", (error) => {
	console.error("[onrecord] database connection closed", error.message);
});

const secret = requireEnv("ONRECORD_STUDIO_SECRET");

export const auth = betterAuth({
	appName: "OnRecord",
	database: pool,
	secret,
	baseURL: requireEnv("HUB_URL"),
	basePath: AUTH_PATH,
	advanced: {
		database: {
			// apps/api parses user ids as UUIDs, so ids must be real UUIDs.
			generateId: () => crypto.randomUUID(),
			validateSchema: false,
		},
	},
	// Sign-in only: the hub must never create OnRecord users.
	emailAndPassword: { enabled: true, disableSignUp: true },
	socialProviders: googleEnabled
		? {
				google: {
					clientId: googleClientId!,
					clientSecret: googleClientSecret!,
					// A Google account with no OnRecord user is refused, not created.
					disableSignUp: true,
					disableImplicitSignUp: true,
				},
			}
		: {},
	user: {
		modelName: "auth_user",
		deleteUser: { enabled: true },
		additionalFields: {
			businessId: { type: "string", required: false, input: false },
			institutionId: { type: "string", required: false, input: false },
		},
	},
	session: { modelName: "auth_session" },
	account: {
		modelName: "auth_account",
		// Same rule as the OnRecord app: a Google sign-in whose email matches an
		// existing user links to that user.
		accountLinking: {
			enabled: true,
			trustedProviders: ["google"],
			requireLocalEmailVerified: false,
		},
	},
	verification: { modelName: "auth_verification" },
	plugins: [
		phoneNumber({
			sendOTP: () => {
				throw new Error("The admin hub does not send OTPs.");
			},
		}),
		organization({
			schema: {
				organization: { modelName: "auth_organization" },
				member: { modelName: "auth_member" },
				invitation: { modelName: "auth_invitation" },
			},
		}),
		admin({ defaultRole: "owner", adminRoles: ["admin"] }),
	],
});

function adminEmails(): string[] | undefined {
	const list = requireList("ONRECORD_ADMIN_EMAILS");
	return list.includes("*") ? undefined : list;
}

export const studioConfig: StudioConfig = {
	auth,
	basePath: BASE_PATH,
	metadata: { title: "OnRecord admin", theme: "dark" },
	access: {
		// Must be an OnRecord user with role "admin" (and on the list, unless "*").
		roles: ["admin"],
		// "*" lets in every OnRecord admin, so admins granted from the dashboard
		// can sign in without a redeploy. Otherwise only the listed emails.
		allowEmails: adminEmails(),
		// Own secret per product, never the studio's built-in default.
		secret,
		sessionDuration: SESSION_SECONDS,
	},
	tools: { exclude: BLOCKED_TOOLS },
};
