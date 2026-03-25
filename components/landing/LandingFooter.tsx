"use client";

import Link from "next/link";

export function LandingFooter() {
	return (
		<footer className="border-t border-[#1c1c30] bg-[#08080f]">
			<div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				{/* Logo */}
				<Link
					href="/"
					onClick={() =>
						window.scrollTo({ top: 0, behavior: "smooth" })
					}
					className="flex items-center gap-2"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/logo-mark.svg" alt="" className="h-6 w-6" />
					<span className="font-mono text-sm font-bold tracking-tight">
						<span className="text-[#dde0f0]">SHORT</span>
						<span className="text-[#ef4444]">PILOT</span>
					</span>
				</Link>

				{/* Copyright */}
				<p className="text-xs text-[#52527a]">
					© {new Date().getFullYear()} Shortpilot. All rights reserved.
				</p>

				{/* Links */}
				<nav className="flex items-center gap-5 text-xs text-[#52527a]">
					<Link
						href="/privacy"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Privacy
					</Link>
					<Link
						href="/terms"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Terms
					</Link>
					<a
						href="/dashboard"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Dashboard
					</a>
				</nav>
			</div>
		</footer>
	);
}
