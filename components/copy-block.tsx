"use client";

import { useState } from "react";

/** A code block with a label and a copy button. */
export function CopyBlock({ label, code, onCopy, tone }: { label: string; code: string; onCopy?: () => void; tone?: "secret" }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
		} catch {}
		setCopied(true);
		onCopy?.();
		setTimeout(() => setCopied(false), 1500);
	}
	return (
		<div className="code-block">
			<div className="code-head">
				<span className="mono faint">{label}</span>
				<button type="button" className="copy-btn" onClick={copy} aria-label={`Copy ${label}`}>
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<pre className={`mono${tone === "secret" ? " secret" : ""}`}>{code}</pre>
		</div>
	);
}
