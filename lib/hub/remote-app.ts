/**
 * Talks to a product that runs the admin-hub plugin (plugin/admin-hub.ts):
 * fetches its schema and builds a database adapter that forwards every
 * read/write to the product's own Better Auth adapter over HTTPS.
 */
import type { DBAdapter } from "@better-auth/core/db/adapter";

export type AppConnection = { kind: "app"; url: string; basePath: string; key: string };

export type RemoteSchema = {
	version: number;
	appName: string | null;
	baseURL: string;
	plugins: string[];
	userFields: string[];
	roles: { default: string | null; admin: string[]; all: string[] | null };
	models: Record<string, { modelName: string; fields: Record<string, { type: string | string[]; required: boolean; input: boolean; fieldName: string }> }>;
};

export function endpoint(c: AppConnection, path: string) {
	return `${c.url.replace(/\/+$/, "")}${c.basePath}/admin-hub/${path}`;
}

async function call<T>(c: AppConnection, path: string, body: unknown): Promise<T> {
	const res = await fetch(endpoint(c, path), {
		method: "POST",
		headers: { "content-type": "application/json", "x-admin-hub-key": c.key },
		body: JSON.stringify(body ?? {}),
		cache: "no-store",
		signal: AbortSignal.timeout(15_000),
	});
	const text = await res.text();
	let data: any = null;
	try {
		data = JSON.parse(text);
	} catch {}
	if (!res.ok) {
		if (res.status === 404) throw new Error("The admin-hub plugin was not found at this URL. Is it installed and is ADMIN_HUB_KEY set in the app?");
		if (res.status === 401) throw new Error("The app rejected the key. Check that it matches the app's ADMIN_HUB_KEY.");
		throw new Error(data?.message || `The app answered ${res.status}.`);
	}
	if (data === null) {
		throw new Error(`The app answered ${res.status} without JSON (${res.headers.get("content-type") ?? "no content-type"}): ${JSON.stringify(text.slice(0, 200))}`);
	}
	return data as T;
}

export async function fetchSchema(c: AppConnection): Promise<RemoteSchema> {
	const schema = await call<RemoteSchema>(c, "schema", {});
	if (!schema?.models?.user) throw new Error("The app answered, but not like the admin-hub plugin.");
	return schema;
}

/** JSON turns Dates into strings; turn them back for date fields. */
function reviver(schema: RemoteSchema, model: string) {
	const fields = schema.models[model]?.fields ?? {};
	const isDate = (f: string) => fields[f]?.type === "date";
	const fix = (row: any): any => {
		if (!row || typeof row !== "object") return row;
		if (Array.isArray(row)) return row.map(fix);
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(row)) out[k] = typeof v === "string" && isDate(k) ? new Date(v) : v;
		return out;
	};
	return fix;
}

/** A Better Auth database adapter backed by the product's admin-hub endpoint. */
export function remoteAdapter(c: AppConnection, schema: RemoteSchema) {
	const rpc = async (op: string, args: Record<string, any>) => {
		let result: any;
		try {
			({ result } = await call<{ result: any }>(c, "rpc", { op, args }));
		} catch (e) {
			console.error(`[hub] ${op} ${args.model} failed:`, (e as Error).message);
			throw e;
		}
		return typeof result === "number" ? result : reviver(schema, String(args.model))(result);
	};
	return (): DBAdapter => {
		const adapter: DBAdapter = {
			id: "admin-hub-remote",
			create: (args) => rpc("create", args),
			findOne: (args) => rpc("findOne", args),
			findMany: (args) => rpc("findMany", args),
			count: (args) => rpc("count", args),
			update: (args) => rpc("update", args),
			updateMany: (args) => rpc("updateMany", args),
			delete: (args) => rpc("delete", args).then(() => undefined),
			deleteMany: (args) => rpc("deleteMany", args),
			consumeOne: async (args) => {
				const row = await rpc("findOne", args);
				if (row) await rpc("delete", args);
				return row;
			},
			incrementOne: async () => {
				throw new Error("Not supported through the admin hub.");
			},
			// No cross-request transactions over HTTP: run the steps in order.
			transaction: (cb) => cb(adapter as any),
			options: { adapterConfig: { adapterId: "admin-hub-remote", adapterName: "Admin hub (remote)" } } as any,
		};
		return adapter;
	};
}

/** The product's user roles, default first. */
export function rolesFrom(schema: RemoteSchema): string[] {
	const list = schema.roles.all?.length ? schema.roles.all : [schema.roles.default ?? "user", ...schema.roles.admin];
	return [...new Set(list.filter(Boolean))] as string[];
}

/** Number of users in the app; also proves the rpc endpoint works with this key. */
export async function countUsers(c: AppConnection): Promise<number> {
	const data = await call<{ result?: unknown } | null>(c, "rpc", { op: "count", args: { model: "user" } });
	if (!data || typeof data.result !== "number") throw new Error("The app's admin-hub plugin answered, but couldn't count its users. Check the app's logs for /admin-hub/rpc errors.");
	return data.result;
}
