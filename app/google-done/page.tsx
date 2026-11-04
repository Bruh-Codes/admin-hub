"use client";

import { useEffect, useState } from "react";

/**
 * After Google, swap the hub's Better Auth session for a studio session. The
 * studio's own /api/auth/verify endpoint does the admin-role and allowlist
 * checks and sets the studio cookie, so the rules are the same as for
 * email + password sign-in.
 */
export default function GoogleDone() {
	const [message, setMessage] = useState("Checking your access…");

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const product = params.get("product") ?? "";
		if (!/^[a-z0-9-]+$/.test(product)) {
			setMessage("Unknown product.");
			return;
		}
		if (params.get("failed") || params.get("error")) {
			setMessage(
				`Google sign-in failed (${params.get("error") ?? "unknown error"}). Your Google email must belong to an existing ${product} user.`,
			);
			return;
		}
		fetch(`/${product}/api/auth/verify`, { method: "POST", credentials: "include" })
			.then(async (res) => {
				const data = await res.json().catch(() => null);
				if (res.ok && data?.success) {
					window.location.replace(`/${product}`);
				} else {
					setMessage(data?.message || "Access denied.");
				}
			})
			.catch(() => setMessage("Could not reach the hub."));
	}, []);

	return (
		<main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
			<p>{message}</p>
			<p>
				<a href="/" style={{ color: "#a3a3a3" }}>
					← Back to the hub
				</a>
			</p>
		</main>
	);
}
