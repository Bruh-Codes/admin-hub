/**
 * Read a required server env var. Throws (fails closed) when it is missing,
 * so a half-configured product never comes up with open or default settings.
 */
export function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} must be set for the admin hub.`);
	}
	return value;
}

/** Comma-separated list env var, lower-cased. Throws when empty. */
export function requireList(name: string): string[] {
	const list = requireEnv(name)
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
	if (list.length === 0) {
		throw new Error(`${name} must list at least one entry.`);
	}
	return list;
}
