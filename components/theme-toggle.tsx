"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "admin-hub-theme";

/** Apply a theme to a document the way the studio does (attribute, class and color-scheme). */
function apply(doc: Document, theme: Theme) {
	const el = doc.documentElement;
	el.dataset.theme = theme;
	el.style.colorScheme = theme;
	el.classList.remove("light", "dark");
	el.classList.add(theme);
}

/** Switches the hub and the studio inside it between dark and light. */
export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
	}, []);

	function toggle() {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		try {
			localStorage.setItem(KEY, next);
			// Same origin as the studio, so this is also what it reads on its next load.
			localStorage.setItem("better-auth-studio-theme", next);
		} catch {}
		document.documentElement.dataset.theme = next;
		const frame = document.getElementById("studio-frame") as HTMLIFrameElement | null;
		try {
			if (frame?.contentDocument) apply(frame.contentDocument, next);
		} catch {}
	}

	const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
	return (
		<button type="button" className="icon-btn" title={label} aria-label={label} onClick={toggle}>
			{theme === "dark" ? (
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
			) : (
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
			)}
		</button>
	);
}
