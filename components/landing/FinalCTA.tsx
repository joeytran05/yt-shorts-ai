import { SignUpButton } from "@clerk/nextjs";

export function FinalCTA() {
	return (
		<section className="py-24 px-6 bg-[#0d0d18] border-t border-[#1c1c30]">
			<div className="max-w-2xl mx-auto text-center">
				{/* Glow */}
				<div
					className="absolute inset-x-0 pointer-events-none"
					style={{
						background:
							"radial-gradient(ellipse 60% 40% at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)",
						height: 300,
					}}
				/>

				<p
					className="text-xs font-bold tracking-widest text-[#52527a] uppercase mb-4"
					style={{ fontFamily: "var(--font-mono)" }}
				>
					Get Started
				</p>
				<h2 className="font-display text-3xl sm:text-4xl font-black text-[#dde0f0] mb-4">
					Ready to automate your Shorts?
				</h2>
				<p className="text-base text-[#52527a] mb-8">
					Join 2,100+ creators already publishing on autopilot.
					<br />
					Your first 3 videos are completely free.
				</p>

				<SignUpButton>
					<button className="px-8 py-3.5 rounded-xl bg-[#ef4444] text-white font-bold text-base hover:bg-[#ef4444]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#ef4444]/20 cursor-pointer">
						Start Free — No credit card required
					</button>
				</SignUpButton>

				<p className="mt-4 text-xs text-[#52527a]">
					Free plan · No credit card · Cancel anytime
				</p>
			</div>
		</section>
	);
}
