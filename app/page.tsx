import { PRODUCTS, googleConfigured } from "@/lib/products";
import { GoogleButton } from "./google-button";

export const dynamic = "force-dynamic";

export default function Home() {
	return (
		<main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
			<h1 style={{ fontSize: 20, fontWeight: 600 }}>Admin hub</h1>
			<p style={{ color: "#a3a3a3" }}>Pick a product. Each one has its own sign-in.</p>
			<ul style={{ listStyle: "none", padding: 0 }}>
				{PRODUCTS.map((p) => (
					<li
						key={p.slug}
						style={{
							borderTop: "1px solid #262626",
							padding: "16px 0",
							display: "flex",
							gap: 16,
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
						}}
					>
						<a href={p.href} style={{ color: "inherit" }}>
							{p.name} (email + password) →
						</a>
						<a href={`/team/${p.slug}`} style={{ color: "#a3a3a3" }}>
							People and roles
						</a>
						{googleConfigured(p.googleEnvPrefix) ? (
							<GoogleButton authPath={p.authPath} slug={p.slug} />
						) : null}
					</li>
				))}
			</ul>
		</main>
	);
}
