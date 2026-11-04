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
					// The studio is shown in a same-origin frame inside the project page.
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
					{ key: "Referrer-Policy", value: "no-referrer" },
				],
			},
		];
	},
};

export default nextConfig;
