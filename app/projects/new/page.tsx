import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { hubOwners } from "@/lib/hub/auth";
import { requireUser } from "@/lib/hub/session";
import { NewProjectForm } from "./form";

export default async function NewProject() {
	const { user } = await requireUser();
	if (!hubOwners().includes(user.email.toLowerCase())) redirect("/projects");
	return (
		<>
			<header className="topbar"><a href="/projects" style={{ textDecoration: "none" }}><Logo /></a></header>
			<main className="page" style={{ maxWidth: 640 }}>
				<a href="/projects" className="muted" style={{ fontSize: 15 }}>← Projects</a>
				<h1 style={{ marginTop: 16 }}>New project</h1>
				<p className="muted" style={{ marginTop: 6, marginBottom: 32 }}>One project per product. Connect a Better Auth app with its URL and admin hub key.</p>
				<NewProjectForm />
			</main>
		</>
	);
}
