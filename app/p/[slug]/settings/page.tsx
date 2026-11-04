import { DEFAULT_CONNECTION, ONRECORD_PRESET, redactConnection } from "@/lib/hub/connection";
import { canManage, getConnection } from "@/lib/hub/projects";
import { requireProject } from "@/lib/hub/session";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function Settings({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ new?: string }> }) {
	const { slug } = await params;
	const { project } = await requireProject(slug);
	const stored = await getConnection(project.id);
	const isNew = (await searchParams).new === "1";
	return (
		<main className="page" style={{ maxWidth: 760 }}>
			<h1>Settings</h1>
			<p className="muted" style={{ marginTop: 6 }}>
				{isNew ? `${project.name} is created. Connect its database to see its users.` : `How the hub connects to ${project.name}'s Better Auth database.`}
			</p>
			<SettingsClient
				slug={slug}
				projectId={project.id}
				projectName={project.name}
				role={project.role}
				canManage={canManage(project.role)}
				initial={stored ? redactConnection(stored.connection) : null}
				defaults={DEFAULT_CONNECTION}
				presets={{ onrecord: ONRECORD_PRESET }}
			/>
		</main>
	);
}
