import { SignUpButton } from "@clerk/nextjs";

const PLANS = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		period: "forever",
		tagline: "Try the pipeline risk-free",
		cta: "Start Free",
		popular: false,
		features: [
			{ label: "3 Shorts / month", included: true },
			{ label: "1 YouTube channel", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: false },
			{ label: "Music library upload", included: false },
			{ label: "Smart scheduling", included: false },
			{ label: "AI idea chatbox", included: false },
			{ label: "Priority rendering", included: false },
		],
	},
	{
		id: "creator",
		name: "Creator",
		price: "$29",
		period: "/ month",
		tagline: "For serious creators scaling output",
		cta: "Start Creating",
		popular: true,
		features: [
			{ label: "30 Shorts / month", included: true },
			{ label: "3 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library upload", included: true },
			{ label: "Smart scheduling", included: true },
			{ label: "AI idea chatbox", included: true },
			{ label: "Priority rendering", included: false },
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$79",
		period: "/ month",
		tagline: "For agencies and power users",
		cta: "Go Pro",
		popular: false,
		features: [
			{ label: "200 Shorts / month", included: true },
			{ label: "10 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library upload", included: true },
			{ label: "Smart scheduling", included: true },
			{ label: "AI idea chatbox", included: true },
			{ label: "Priority rendering", included: true },
		],
	},
];

function Check({ included }: { included: boolean }) {
	return (
		<span className={included ? "text-[#22c55e]" : "text-[#1c1c30]"}>
			{included ? "✓" : "—"}
		</span>
	);
}

export function PricingSection() {
	return (
		<section id="pricing" className="py-24 px-6">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="text-center mb-14">
					<p
						className="text-xs font-bold tracking-widest text-[#52527a] uppercase mb-3"
						style={{ fontFamily: "var(--font-mono)" }}
					>
						Pricing
					</p>
					<h2 className="font-display text-3xl sm:text-4xl font-black text-[#dde0f0] mb-3">
						Simple, transparent pricing
					</h2>
					<p className="text-sm text-[#52527a]">
						Start free. Upgrade when you&apos;re ready to scale.
					</p>
				</div>

				{/* Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
					{PLANS.map((plan) => (
						<div
							key={plan.id}
							className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
								plan.popular
									? "border-[#ef4444] bg-[#0d0d18] shadow-lg shadow-[#ef4444]/10 scale-[1.02]"
									: "border-[#1c1c30] bg-[#0d0d18] hover:border-[#2d2d50]"
							}`}
						>
							{/* Popular badge */}
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<span className="px-3 py-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold uppercase tracking-widest">
										⭐ Most Popular
									</span>
								</div>
							)}

							{/* Plan header */}
							<div className="mb-5">
								<h3 className="font-display text-lg font-black text-[#dde0f0] mb-1">
									{plan.name}
								</h3>
								<p className="text-xs text-[#52527a] mb-4">{plan.tagline}</p>
								<div className="flex items-baseline gap-1">
									<span className="font-display text-4xl font-black text-[#dde0f0]">
										{plan.price}
									</span>
									<span className="text-sm text-[#52527a]">{plan.period}</span>
								</div>
							</div>

							{/* CTA */}
							<SignUpButton>
								<button
									className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer mb-6 ${
										plan.popular
											? "bg-[#ef4444] text-white hover:bg-[#ef4444]/90 shadow-md shadow-[#ef4444]/20"
											: "border border-[#2d2d50] text-[#dde0f0] hover:bg-[#1c1c30]"
									}`}
								>
									{plan.cta} →
								</button>
							</SignUpButton>

							{/* Feature list */}
							<ul className="space-y-2.5">
								{plan.features.map((f, i) => (
									<li key={i} className="flex items-center gap-2.5 text-sm">
										<Check included={f.included} />
										<span
											className={
												f.included ? "text-[#dde0f0]" : "text-[#52527a]"
											}
										>
											{f.label}
										</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<p className="text-center mt-8 text-xs text-[#52527a]">
					All plans include unlimited idea storage. Prices in USD. Cancel anytime.
				</p>
			</div>
		</section>
	);
}
