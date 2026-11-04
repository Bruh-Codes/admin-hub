import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { envList, requireEnv } from "../env";
import { hubPool } from "./db";

/**
 * Hub accounts. Google only, invite-only: a Google account can create a hub
 * account only when its email is in HUB_OWNER_EMAILS or has a pending
 * project invitation. Projects are Better Auth organizations; project
 * members and invitations use the organization plugin as-is.
 */
export const hubOwners = () => envList("HUB_OWNER_EMAILS");

async function hasPendingInvite(email: string): Promise<boolean> {
	const { rows } = await hubPool.query(
		`select 1 from invitation where lower(email) = $1 and status = 'pending' and "expiresAt" > now() limit 1`,
		[email.toLowerCase()],
	);
	return rows.length > 0;
}

// Tolerate "admin-hub.vercel.app" or a trailing slash in HUB_URL.
const hubUrl = (() => {
	const raw = requireEnv("HUB_URL").trim().replace(/\/+$/, "");
	return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
})();
// Also accept Vercel's own production domain, so a HUB_URL that names a
// different alias doesn't reject sign-in with "Invalid origin".
const vercelOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL]
	.filter((h): h is string => !!h)
	.map((h) => `https://${h}`);

export const hubAuth = betterAuth({
	appName: "Admin hub",
	database: hubPool,
	secret: requireEnv("HUB_SECRET"),
	baseURL: hubUrl,
	// Same-origin requests are always fine: trust the host actually serving
	// this request (on Vercel that's the domain in the address bar).
	trustedOrigins: async (request) => {
		const own: string[] = [];
		if (request) {
			try {
				const host = (request.headers.get("x-forwarded-host") ?? new URL(request.url).host).split(",")[0].trim();
				own.push(`https://${host}`);
			} catch {}
			// The browser marks requests from our own pages as same-origin; a
			// cross-site page can't forge this header, so its Origin is ours.
			const origin = request.headers.get("origin");
			if (origin && request.headers.get("sec-fetch-site") === "same-origin") own.push(origin);
		}
		return [hubUrl, ...vercelOrigins, ...own];
	},
	socialProviders: {
		google: {
			clientId: requireEnv("HUB_GOOGLE_CLIENT_ID"),
			clientSecret: requireEnv("HUB_GOOGLE_CLIENT_SECRET"),
			prompt: "select_account",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		cookieCache: { enabled: true, maxAge: 60 },
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const email = user.email.toLowerCase();
					if (hubOwners().includes(email) || (await hasPendingInvite(email))) return;
					throw new APIError("FORBIDDEN", {
						message: "This Google account has not been invited to any project.",
					});
				},
			},
		},
	},
	plugins: [
		organization({
			// Only hub owners can create projects (each project holds a database URL).
			allowUserToCreateOrganization: async (user) => hubOwners().includes(user.email.toLowerCase()),
			invitationExpiresIn: 60 * 60 * 24 * 7,
			cancelPendingInvitationsOnReInvite: true,
		}),
	],
});

export type HubSession = typeof hubAuth.$Infer.Session;
