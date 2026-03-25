"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export function LandingNav() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		// header scroll not working
		<header
			className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-[#08080f]/90 backdrop-blur-md border-b border-[#1c1c30]"
					: "bg-transparent"
			}`}
		>
			<div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
				{/* Logo */}
				<Link
					href="/"
					onClick={() =>
						window.scrollTo({ top: 0, behavior: "smooth" })
					}
					className="flex items-center gap-2 ml-5 shrink-0"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/logo-mark.svg" alt="" className="h-9 w-9" />
					<span className="font-mono text-lg font-bold tracking-tight">
						<span className="text-[#dde0f0]">SHORT</span>
						<span className="text-[#ef4444]">PILOT</span>
					</span>
				</Link>

				{/* Nav links — hidden on small screens */}
				<nav className="hidden md:flex items-center gap-8 text-sm text-[#52527a]">
					<a
						href="#how-it-works"
						className="hover:text-[#dde0f0] transition-colors"
					>
						How it works
					</a>
					<a
						href="#features"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Features
					</a>
					<a
						href="#pricing"
						className="hover:text-[#dde0f0] transition-colors"
					>
						Pricing
					</a>
				</nav>

				{/* Auth CTAs */}
				<div className="flex items-center gap-3">
					<SignInButton>
						<button className="hidden sm:block px-4 py-1.5 text-sm font-medium text-[#dde0f0]/70 hover:text-[#dde0f0] transition-colors cursor-pointer">
							Sign in
						</button>
					</SignInButton>
					<SignUpButton>
						<button className="px-4 py-1.5 text-sm font-bold rounded-lg bg-[#ef4444] text-white hover:bg-[#ef4444]/90 transition-colors cursor-pointer">
							Start Free
						</button>
					</SignUpButton>
				</div>
			</div>
		</header>
	);
}
