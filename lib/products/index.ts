/** Every product the hub manages. Add a line here when you add a product. */
export const PRODUCTS = [
	{
		slug: "onrecord",
		name: "OnRecord",
		href: "/onrecord",
		authPath: "/api/auth/onrecord",
		googleEnvPrefix: "ONRECORD",
	},
] as const;

export function googleConfigured(envPrefix: string): boolean {
	return Boolean(
		process.env[`${envPrefix}_GOOGLE_CLIENT_ID`]?.trim() &&
			process.env[`${envPrefix}_GOOGLE_CLIENT_SECRET`]?.trim(),
	);
}
