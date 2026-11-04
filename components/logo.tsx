export function Logo({ size = 28 }: { size?: number }) {
	return (
		<span className="row" style={{ gap: 10 }}>
			<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
				<rect x="1" y="1" width="30" height="30" rx="8" fill="#fafafa" />
				<path d="M9 22V10h4.5l3.5 7 3.5-7H23v12h-3.5v-6.5L17 20.5h-0.1l-2.4-5V22z" fill="#0a0a0a" />
			</svg>
			<span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>Admin hub</span>
		</span>
	);
}
