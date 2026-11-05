import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = { title: "Admin hub", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
			<head>
				{/* Set the saved theme before the first paint. */}
				<script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("admin-hub-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}` }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
