const STEPS = [
	{
		number: "01",
		label: "Discover",
		color: "#3d9eff",
		description:
			"Scrape YouTube daily for trending content. AI scores every idea 0–100 on virality, hook strength, and competition.",
	},
	{
		number: "02",
		label: "Script",
		color: "#a855f7",
		description:
			"Approve ideas and the AI generates a full script — hook, body, and CTA — optimised for a 58-second Short.",
	},
	{
		number: "03",
		label: "Produce",
		color: "#f97316",
		description:
			"ElevenLabs voice synthesis, Pexels stock footage, auto-captions, and background music — all rendered automatically.",
	},
	{
		number: "04",
		label: "Review",
		color: "#eab308",
		description:
			"Preview your video before it goes live. Approve it, request changes, or edit the script and re-produce.",
	},
	{
		number: "05",
		label: "Publish",
		color: "#22c55e",
		description:
			"Upload directly to YouTube or schedule for a peak-engagement time slot. Track views and performance in-app.",
	},
];

export function HowItWorksSection() {
	return (
		<section id="how-it-works" className="py-24 px-6">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<p
						className="text-xs font-bold tracking-widest text-[#52527a] uppercase mb-3"
						style={{ fontFamily: "var(--font-mono)" }}
					>
						The Pipeline
					</p>
					<h2 className="font-display text-3xl sm:text-4xl font-black text-[#dde0f0]">
						From idea to published in minutes
					</h2>
				</div>

				{/* Steps */}
				<div className="relative">
					{/* Connector line — desktop */}
					<div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-[#1c1c30]" />

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
						{STEPS.map((step, i) => (
							<div key={i} className="relative flex flex-col items-center text-center group">
								{/* Number circle */}
								<div
									className="relative z-10 w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
									style={{
										borderColor: step.color,
										background: `${step.color}12`,
									}}
								>
									<span
										className="text-sm font-black"
										style={{ color: step.color, fontFamily: "var(--font-mono)" }}
									>
										{step.number}
									</span>
								</div>

								<h3
									className="font-display text-sm font-bold mb-2"
									style={{ color: step.color }}
								>
									{step.label}
								</h3>
								<p className="text-xs text-[#52527a] leading-relaxed">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
