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
	title: "Shorts.AI - YT Shorts AI Agent",
	description: "Automated YouTube Shorts pipeline",
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
