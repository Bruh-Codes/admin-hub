/** Browser helpers shared by React Query hooks. Every helper throws an Error with a readable message. */

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
	const { json, ...rest } = init ?? {};
	const res = await fetch(url, {
		...rest,
		headers: json !== undefined ? { "content-type": "application/json", ...rest.headers } : rest.headers,
		body: json !== undefined ? JSON.stringify(json) : rest.body,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status}).`);
	return data as T;
}

/** Better Auth client calls return { data, error }; turn the error into a throw. */
export async function unwrap<T>(p: Promise<{ data: T; error: { message?: string } | null }>): Promise<T> {
	const { data, error } = await p;
	if (error) throw new Error(error.message ?? "Something went wrong.");
	return data;
}

export const queryKeys = {
	team: (slug: string) => ["project", slug, "team"] as const,
	connection: (slug: string) => ["project", slug, "connection"] as const,
};
