const STATS = [
	{ value: "12,400+", label: "Shorts Created" },
	{ value: "2,100+", label: "Creators" },
	{ value: "4.8★", label: "Average Rating" },
	{ value: "58s", label: "Avg. Short Length" },
];

export function SocialProofBar() {
	return (
		<div className="border-y border-[#1c1c30] bg-[#0d0d18]">
			<div className="max-w-5xl mx-auto px-6 py-5">
				<div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
					{STATS.map((s, i) => (
						<div key={i} className="flex items-center gap-3">
							{i > 0 && (
								<span className="hidden sm:block text-[#1c1c30]">·</span>
							)}
							<div className="text-center">
								<span
									className="text-lg font-bold text-[#dde0f0]"
									style={{ fontFamily: "var(--font-mono)" }}
								>
									{s.value}
								</span>
								<span className="ml-2 text-xs text-[#52527a]">{s.label}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
