import { SignUpButton } from "@clerk/nextjs";
import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
	return (
		<section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
			{/* Background glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(239,68,68,0.08) 0%, transparent 70%)",
				}}
			/>

			<div className="relative w-full max-w-5xl mx-auto flex flex-col items-center text-center">
				{/* Eyebrow badge */}
				<div
					className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1c1c30] 
						bg-[#0d0d18] text-[11px] font-bold text-[#52527a] uppercase tracking-widest mb-6"
				>
					<span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse inline-block" />
					Automated YouTube Shorts Pipeline
				</div>

				{/* Headline */}
				<h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[#dde0f0] leading-[1.1] tracking-tight mb-5 max-w-3xl">
					Turn Trending Ideas into{" "}
					<span className="text-[#ef4444]">YouTube Shorts</span> — On
					Autopilot
				</h1>

				{/* Sub-headline */}
				<p className="text-base sm:text-lg text-[#52527a] max-w-xl leading-relaxed mb-8">
					Discover viral content, generate AI scripts, produce full
					videos with voiceover and captions, and publish — all from
					one dashboard.
				</p>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
					<SignUpButton>
						<button className="px-7 py-3 rounded-xl bg-[#ef4444] text-white font-bold text-sm hover:bg-[#ef4444]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ef4444]/20 cursor-pointer">
							Start Free — No credit card required
						</button>
					</SignUpButton>
					<a
						href="#how-it-works"
						className="px-7 py-3 rounded-xl border border-[#1c1c30] text-[#dde0f0]/70 font-medium text-sm hover:border-[#2d2d50] hover:text-[#dde0f0] transition-colors"
					>
						See How It Works ↓
					</a>
				</div>

				{/* Dashboard mockup */}
				<div className="w-full max-w-3xl">
					<DashboardMockup />
				</div>

				{/* Subtle caption */}
				<p className="mt-4 text-xs text-[#52527a]">
					Live product preview · No setup required
				</p>
			</div>
		</section>
	);
}
