"use client";

import { usePathname } from "next/navigation";

export function ProjectTabs({ slug }: { slug: string }) {
	const path = usePathname();
	const tabs = [
		{ href: `/p/${slug}`, label: "Dashboard", match: (p: string) => p === `/p/${slug}` },
		{ href: `/p/${slug}/team`, label: "Team", match: (p: string) => p.startsWith(`/p/${slug}/team`) },
		{ href: `/p/${slug}/settings`, label: "Settings", match: (p: string) => p.startsWith(`/p/${slug}/settings`) },
	];
	return (
		<nav className="tabs" aria-label="Project">
			{tabs.map((t) => (
				<a key={t.href} href={t.href} className="tab" aria-current={t.match(path) ? "page" : undefined}>{t.label}</a>
			))}
		</nav>
	);
}
