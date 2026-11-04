export const metadata = { title: "Admin hub", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body style={{ margin: 0, background: "#0a0a0a", color: "#fafafa", fontFamily: "ui-monospace, monospace" }}>
				{children}
			</body>
		</html>
	);
}
