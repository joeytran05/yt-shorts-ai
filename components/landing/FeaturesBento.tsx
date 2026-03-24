const FEATURES = [
	{
		icon: "🔍",
		title: "AI Trend Discovery",
		description:
			"Scrapes YouTube daily and scores ideas 0–100 on viral potential, hook strength, and competition level. You only review the best.",
		wide: true,
		color: "#3d9eff",
	},
	{
		icon: "✍️",
		title: "Script Generation",
		description:
			"Hook, body, and CTA written in seconds by GPT-4o, optimised for 58-second Shorts that retain viewers.",
		wide: false,
		color: "#a855f7",
	},
	{
		icon: "🎤",
		title: "Voice + Video",
		description:
			"ElevenLabs voiceover, Pexels stock footage, Ken Burns zoom, and auto word-by-word captions — fully rendered.",
		wide: false,
		color: "#f97316",
	},
	{
		icon: "📅",
		title: "Smart Scheduling",
		description:
			"Automatically uploads at peak-engagement hours based on your audience timezone.",
		wide: false,
		color: "#eab308",
	},
	{
		icon: "📊",
		title: "Multi-Channel",
		description:
			"Connect up to 10 YouTube channels. Run separate pipelines with different niches and queries per channel.",
		wide: false,
		color: "#22c55e",
	},
	{
		icon: "🎵",
		title: "Custom Music",
		description:
			"Upload your own background tracks by mood. Mixed at 20% volume under the voiceover automatically.",
		wide: false,
		color: "#a855f7",
	},
	{
		icon: "💬",
		title: "AI Idea Chatbox",
		description:
			"Manually add ideas by chatting with an AI assistant. Describe a topic, refine the angle, and inject it straight into your pipeline.",
		wide: false,
		color: "#3d9eff",
	},
];

export function FeaturesBento() {
	return (
		<section
			id="features"
			className="py-24 px-6 bg-[#0d0d18] border-y border-[#1c1c30]"
		>
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="text-center mb-14">
					<p
						className="text-xs font-bold tracking-widest text-[#52527a] uppercase mb-3"
						style={{ fontFamily: "var(--font-mono)" }}
					>
						Features
					</p>
					<h2 className="font-display text-3xl sm:text-4xl font-black text-[#dde0f0]">
						Everything you need, nothing you don&apos;t
					</h2>
				</div>

				{/* Bento grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
					{FEATURES.map((f, i) => (
						<div
							key={i}
							className={`relative rounded-2xl border border-[#1c1c30] bg-[#111120] p-6 hover:border-[#2d2d50] transition-all duration-300 hover:-translate-y-0.5 group ${
								f.wide ? "sm:col-span-2" : ""
							}`}
						>
							{/* Subtle glow on hover */}
							<div
								className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
								style={{
									background: `radial-gradient(ellipse 60% 40% at 30% 30%, ${f.color}08 0%, transparent 70%)`,
								}}
							/>

							<span className="text-2xl mb-4 block">{f.icon}</span>
							<h3
								className="font-display text-base font-bold mb-2"
								style={{ color: f.color }}
							>
								{f.title}
							</h3>
							<p className="text-sm text-[#52527a] leading-relaxed">
								{f.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
