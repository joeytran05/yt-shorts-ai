import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { DM_Mono, Syne } from "next/font/google";
import { ClerkProvider, Show } from "@clerk/nextjs";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";

const dmMono = DM_Mono({
	subsets: ["latin"],
	weight: ["300", "400", "500"],
	variable: "--font-mono",
});

const syne = Syne({
	subsets: ["latin"],
	weight: ["600", "700", "800"],
	variable: "--font-display",
});

export const metadata: Metadata = {
	title: "Shortpilot — Automated YouTube Shorts",
	description:
		"Turn trending ideas into published YouTube Shorts — fully on autopilot. AI scripts, voiceovers, video rendering, and auto-publishing in one pipeline.",
	icons: {
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
		apple: "/favicon.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${dmMono.variable} ${syne.variable} antialiased bg-[#08080f]`}
			>
				<ClerkProvider>
					{children}
					<Toaster />
					<Show when="signed-in">
						<TutorialOverlay />
					</Show>
				</ClerkProvider>
			</body>
		</html>
	);
}
