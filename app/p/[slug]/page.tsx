import { getConnection, canManage } from "@/lib/hub/projects";
import { studioBasePath } from "@/lib/hub/product-studio";
import { requireProject } from "@/lib/hub/session";

export const dynamic = "force-dynamic";

export default async function Dashboard({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const { project } = await requireProject(slug);
	const connected = await getConnection(project.id);
	if (!connected) {
		return (
			<main className="page" style={{ maxWidth: 560 }}>
				<h1>Connect your app</h1>
				<p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
					{project.name} isn't connected yet.
					{canManage(project.role) ? "" : " Ask a project owner or admin to connect it."}
				</p>
				{canManage(project.role) ? <a className="btn btn-primary" href={`/p/${slug}/settings`}>Open settings</a> : null}
			</main>
		);
	}
	return (
		<iframe
			id="studio-frame"
			title={`${project.name} dashboard`}
			src={studioBasePath(slug)}
			style={{ border: 0, width: "100%", height: "100%", display: "block", background: "var(--bg)" }}
		/>
	);
}
