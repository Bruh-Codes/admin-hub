import { PRODUCTS } from "@/lib/products";

export default function Home() {
	return (
		<main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
			<h1 style={{ fontSize: 20, fontWeight: 600 }}>Admin hub</h1>
			<p style={{ color: "#a3a3a3" }}>Pick a product. Each one has its own sign-in.</p>
			<ul style={{ listStyle: "none", padding: 0 }}>
				{PRODUCTS.map((p) => (
					<li key={p.slug} style={{ borderTop: "1px solid #262626" }}>
						<a href={p.href} style={{ display: "block", padding: "16px 0", color: "inherit" }}>
							{p.name} →
						</a>
					</li>
				))}
			</ul>
		</main>
	);
}
