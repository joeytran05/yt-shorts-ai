import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { DM_Mono, Syne } from "next/font/google";
import { ClerkProvider, Show, SignInButton, SignUpButton } from "@clerk/nextjs";
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
					<Show when="signed-out">
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080f]">
							<div className="flex flex-col items-center gap-6 text-center px-6">
								<p className="font-display text-3xl font-black tracking-tight">
									<span className="text-danger">▶</span>
									SHORTS
									<span className="text-muted">.AI</span>
								</p>
								<p className="text-sm text-muted max-w-xs">
									Automated YouTube Shorts pipeline — sign in
									to continue.
								</p>
								<div className="flex gap-3">
									<SignInButton>
										<button className="px-5 py-2 text-sm font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition-colors">
											Sign in
										</button>
									</SignInButton>
									<SignUpButton>
										<button className="px-5 py-2 text-sm font-semibold rounded-lg border border-border text-text hover:bg-neutral-800 transition-colors">
											Sign up
										</button>
									</SignUpButton>
								</div>
							</div>
						</div>
					</Show>

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
