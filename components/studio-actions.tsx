"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The studio's own header is hidden (see lib/studio-theme.ts); its useful
 * controls live here instead and drive the studio inside the iframe.
 */
function studioDoc(): Document | null {
	const frame = document.getElementById("studio-frame") as HTMLIFrameElement | null;
	try {
		return frame?.contentDocument ?? null;
	} catch {
		return null;
	}
}

function openSearch() {
	const doc = studioDoc();
	if (!doc) return;
	doc.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true }));
	(document.getElementById("studio-frame") as HTMLIFrameElement | null)?.focus();
}

function clickStudio(label: string) {
	studioDoc()?.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.click();
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function StudioActions({ slug }: { slug: string }) {
	const onDashboard = usePathname() === `/p/${slug}`;

	// ⌘K / Ctrl+K on the hub page opens the studio's search too.
	useEffect(() => {
		if (!onDashboard) return;
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				openSearch();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onDashboard]);

	if (!onDashboard) return null;
	return (
		<div className="studio-actions">
			<button type="button" className="search-btn" onClick={openSearch}>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
				<span className="hide-sm">Search</span>
				<kbd className="hide-sm">{isMac ? "⌘" : "Ctrl"} K</kbd>
			</button>
			<button type="button" className="icon-btn" title="Share / export" aria-label="Share" onClick={() => clickStudio("Export analytics")}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
			</button>
		</div>
	);
}
