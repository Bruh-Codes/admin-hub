/**
 * How the hub reaches one product's Better Auth data. Stored encrypted per
 * project and edited on the project's Settings page.
 */
export type ProductConnection = {
	kind?: "database";
	databaseUrl: string;
	/** Table (model) names. Better Auth defaults are user, session, ... */
	models: {
		user: string;
		session: string;
		account: string;
		verification: string;
		organization: string;
		member: string;
		invitation: string;
	};
	/** "uuid" when the product generates ids with crypto.randomUUID(). */
	idStrategy: "default" | "uuid";
	plugins: { admin: boolean; organization: boolean; phoneNumber: boolean };
	/** Extra string columns on the user table, e.g. businessId. */
	userFields: string[];
	/** The product's user roles. First one is the everyday default. */
	roles: string[];
};

export const DEFAULT_CONNECTION: Omit<ProductConnection, "databaseUrl"> = {
	models: {
		user: "user",
		session: "session",
		account: "account",
		verification: "verification",
		organization: "organization",
		member: "member",
		invitation: "invitation",
	},
	idStrategy: "default",
	plugins: { admin: true, organization: false, phoneNumber: false },
	userFields: [],
	roles: ["user", "admin"],
};

/** Preset matching OnRecord's apps/web/lib/auth.ts. */
export const ONRECORD_PRESET: Omit<ProductConnection, "databaseUrl"> = {
	models: {
		user: "auth_user",
		session: "auth_session",
		account: "auth_account",
		verification: "auth_verification",
		organization: "auth_organization",
		member: "auth_member",
		invitation: "auth_invitation",
	},
	idStrategy: "uuid",
	plugins: { admin: true, organization: true, phoneNumber: true },
	userFields: ["businessId", "institutionId"],
	roles: ["owner", "reviewer", "admin"],
};

const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;

/** Validate untrusted form input into a connection. Throws with a readable message. */
export function parseConnection(input: unknown): ProductConnection {
	const v = (input ?? {}) as Record<string, any>;
	const databaseUrl = String(v.databaseUrl ?? "").trim();
	if (!/^postgres(ql)?:\/\//.test(databaseUrl)) throw new Error("Database URL must start with postgres:// or postgresql://.");
	const models = { ...DEFAULT_CONNECTION.models };
	for (const k of Object.keys(models) as (keyof typeof models)[]) {
		const name = String(v.models?.[k] ?? models[k]).trim();
		if (!NAME.test(name)) throw new Error(`Table name for ${k} is not valid.`);
		models[k] = name;
	}
	const userFields = (Array.isArray(v.userFields) ? v.userFields : String(v.userFields ?? "").split(","))
		.map((f: unknown) => String(f).trim())
		.filter(Boolean);
	for (const f of userFields) if (!NAME.test(f)) throw new Error(`User field "${f}" is not valid.`);
	const roles = (Array.isArray(v.roles) ? v.roles : String(v.roles ?? "").split(","))
		.map((r: unknown) => String(r).trim().toLowerCase())
		.filter(Boolean);
	if (roles.length === 0) throw new Error("List at least one user role.");
	for (const r of roles) if (!/^[a-z][a-z0-9_-]{0,31}$/.test(r)) throw new Error(`Role "${r}" is not valid.`);
	return {
		databaseUrl,
		models,
		idStrategy: v.idStrategy === "uuid" ? "uuid" : "default",
		plugins: {
			admin: v.plugins?.admin !== false,
			organization: Boolean(v.plugins?.organization),
			phoneNumber: Boolean(v.plugins?.phoneNumber),
		},
		userFields,
		roles,
	};
}

/** Connection with the database password hidden, safe to send to the browser. */
export function redactConnection(c: ProductConnection) {
	let host = "";
	try {
		const u = new URL(c.databaseUrl);
		host = `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
	} catch {}
	return { ...c, databaseUrl: "", databaseHost: host };
}

import type { AppConnection } from "./remote-app";
export type ProjectConnection = ProductConnection | AppConnection;

export function isApp(c: ProjectConnection): c is AppConnection {
	return (c as AppConnection).kind === "app";
}

/** Validate an app URL + key from the form. */
export function parseAppConnection(input: unknown): AppConnection {
	const v = (input ?? {}) as Record<string, any>;
	let url: URL;
	try {
		const raw = String(v.url ?? "").trim();
		url = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
	} catch {
		throw new Error("Enter the app's URL, e.g. https://app.example.com");
	}
	// Plain http only for local testing (HUB_ALLOW_HTTP_APPS=1); keys never travel unencrypted in production.
	if (url.protocol !== "https:" && process.env.HUB_ALLOW_HTTP_APPS !== "1") throw new Error("The app URL must use https://.");
	const basePath = "/" + String(v.basePath ?? "/api/auth").trim().replace(/^\/+|\/+$/g, "");
	if (!/^\/[A-Za-z0-9/_-]*$/.test(basePath)) throw new Error("Auth path is not valid.");
	const key = String(v.key ?? "").trim();
	if (key.length < 32) throw new Error("The key must be at least 32 characters (the app's ADMIN_HUB_KEY).");
	return { kind: "app", url: url.origin, basePath, key };
}

/** Safe to send to the browser: no key, no password. */
export function redactProjectConnection(c: ProjectConnection) {
	if (isApp(c)) return { kind: "app" as const, url: c.url, basePath: c.basePath };
	return { kind: "database" as const, ...redactConnection(c) };
}
