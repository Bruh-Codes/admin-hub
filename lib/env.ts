/**
 * Read a required server env var. Throws (fails closed) when it is missing,
 * so a half-configured hub never comes up with open or default settings.
 */
export function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} must be set for the admin hub.`);
	}
	return value;
}

/** Comma-separated list env var, lower-cased. Empty list when unset. */
export function envList(name: string): string[] {
	return (process.env[name] ?? "")
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
}
