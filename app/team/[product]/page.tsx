import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/products";
import { TeamManager } from "./team-manager";

export default async function TeamPage({ params }: { params: Promise<{ product: string }> }) {
	const { product } = await params;
	const config = PRODUCTS.find((p) => p.slug === product);
	if (!config) notFound();
	return (
		<main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px" }}>
			<p><a href="/" style={{ color: "#a3a3a3" }}>← Admin hub</a></p>
			<h1 style={{ fontSize: 20, fontWeight: 600 }}>{config.name}: people and roles</h1>
			<p style={{ color: "#a3a3a3", lineHeight: 1.5 }}>
				Add someone by email with a role, or change the role of an existing user. New people
				sign in to {config.name} with Google using that email (or set a password with
				&quot;Forgot password&quot;). Admins can also open this hub.
			</p>
			<TeamManager basePath={config.href} roles={[...config.roles]} defaultRole={config.roles[0]} />
		</main>
	);
}
