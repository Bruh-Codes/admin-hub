import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { Logo } from "@/components/logo";
import { hubAuth } from "@/lib/hub/auth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
	unable_to_create_user: "This Google account hasn't been invited to a project yet. Ask a project admin to invite your email.",
	access_denied: "Google sign-in was cancelled.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
	const session = await hubAuth.api.getSession({ headers: await headers() });
	if (session) redirect("/projects");
	const { error } = await searchParams;

	return (
		<main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
			<div className="card" style={{ width: "100%", maxWidth: 420, padding: 40 }}>
				<Logo size={36} />
				<h1 style={{ marginTop: 32, fontSize: 26 }}>Sign in</h1>
				<p className="muted" style={{ marginTop: 8, marginBottom: 28 }}>
					Manage users, organizations and sessions across your products.
				</p>
				<GoogleButton />
				{error ? (
					<p className="error" style={{ marginTop: 16, fontSize: 15 }}>
						{ERRORS[error] ?? `Sign-in failed (${error}).`}
					</p>
				) : null}
				<p className="faint" style={{ marginTop: 28, fontSize: 14 }}>
					Access is by invitation. New accounts are only created for invited emails.
				</p>
			</div>
		</main>
	);
}
