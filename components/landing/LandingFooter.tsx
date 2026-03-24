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
					className="font-display text-base font-black tracking-tight"
				>
					<span className="text-[#ef4444]">▶</span>
					SHORTS
					<span className="text-[#52527a]">.AI</span>
				</Link>

				{/* Copyright */}
				<p className="text-xs text-[#52527a]">
					© {new Date().getFullYear()} Shorts.AI. All rights reserved.
				</p>

				{/* Links */}
				<nav className="flex items-center gap-5 text-xs text-[#52527a]">
					<a
						// href="/privacy"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Privacy
					</a>
					<a
						// href="/terms"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Terms
					</a>
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
