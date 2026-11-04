import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { hubOwners } from "@/lib/hub/auth";
import { requireUser } from "@/lib/hub/session";
import { NewProjectForm } from "./form";

export default async function NewProject() {
	const { user } = await requireUser();
	if (!hubOwners().includes(user.email.toLowerCase())) redirect("/projects");
	const hubUrl = (process.env.HUB_URL ?? "").replace(/\/+$/, "");
	return (
		<>
			<header className="topbar">
				<a href="/projects" style={{ textDecoration: "none" }}><Logo /></a>
				<div style={{ flex: 1 }} />
				<UserMenu name={user.name} email={user.email} image={user.image} />
			</header>
			<NewProjectForm hubUrl={hubUrl} />
		</>
	);
}
