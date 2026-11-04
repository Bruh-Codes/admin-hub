import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// The studio reads its UI files from its own dist/public folder at runtime,
	// so keep it as a plain node_modules package and ship that folder with
	// every product route.
	serverExternalPackages: ["better-auth-studio"],
	outputFileTracingIncludes: {
		"/**": ["./node_modules/better-auth-studio/dist/public/**/*"],
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Robots-Tag", value: "noindex, nofollow" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Referrer-Policy", value: "no-referrer" },
				],
			},
		];
	},
};

export default nextConfig;
