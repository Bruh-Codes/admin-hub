import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { hubOwners } from "@/lib/hub/auth";
import { requireUser } from "@/lib/hub/session";
import { NewProjectForm } from "./form";

export default async function NewProject() {
	const { user } = await requireUser();
	if (!hubOwners().includes(user.email.toLowerCase())) redirect("/projects");
	const raw = (process.env.HUB_URL ?? "").trim().replace(/\/+$/, "");
	const hubUrl = !raw || /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
	return (
		<>
			<header className="topbar">
				<a href="/projects" style={{ textDecoration: "none" }}><Logo /></a>
				<div style={{ flex: 1 }} />
				<ThemeToggle />
				<UserMenu name={user.name} email={user.email} image={user.image} />
			</header>
			<NewProjectForm hubUrl={hubUrl} />
		</>
	);
}
