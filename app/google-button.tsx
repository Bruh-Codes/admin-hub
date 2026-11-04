"use client";

import { useState } from "react";

/** Starts Better Auth's Google flow for one product, then lands on /google-done. */
export function GoogleButton({ authPath, slug }: { authPath: string; slug: string }) {
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function start() {
		setBusy(true);
		setError(null);
		try {
			const res = await fetch(`${authPath}/sign-in/social`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					provider: "google",
					callbackURL: `/google-done?product=${encodeURIComponent(slug)}`,
					errorCallbackURL: `/google-done?product=${encodeURIComponent(slug)}&failed=1`,
					disableRedirect: true,
				}),
			});
			const data = await res.json().catch(() => null);
			if (!res.ok || !data?.url) throw new Error(data?.message || "Could not start Google sign-in.");
			window.location.href = data.url;
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setBusy(false);
		}
	}

	return (
		<span>
			<button
				type="button"
				onClick={start}
				disabled={busy}
				style={{ background: "#fafafa", color: "#0a0a0a", border: 0, padding: "8px 14px", cursor: "pointer", font: "inherit" }}
			>
				{busy ? "Opening Google…" : "Sign in with Google"}
			</button>
			{error ? <span style={{ color: "#f87171", marginLeft: 8 }}>{error}</span> : null}
		</span>
	);
}
