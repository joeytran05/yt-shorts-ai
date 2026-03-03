import type { PipelineCount, IdeaStatus } from "@/types";

const ITEMS = [
	{
		label: "Discovered",
		statuses: ["discovered", "scored"] as IdeaStatus[],
		color: "var(--score)",
	},
	{
		label: "Scripted",
		statuses: ["approved", "scripted"] as IdeaStatus[],
		color: "var(--script)",
	},
	{
		label: "Production",
		statuses: [
			"generating_voice",
			"generating_video",
			"adding_captions",
			"produced",
		] as IdeaStatus[],
		color: "var(--prod)",
	},
	{
		label: "Review",
		statuses: ["changes_requested", "ready_to_publish"] as IdeaStatus[],
		color: "var(--review)",
	},
	{
		label: "Published",
		statuses: ["scheduled", "uploading", "published"] as IdeaStatus[],
		color: "var(--publish)",
	},
] as const;

const PipelineStrip = ({ counts }: { counts: PipelineCount[] }) => {
	const sum = (statuses: readonly IdeaStatus[]) =>
		counts
			.filter((c) => statuses.includes(c.status))
			.reduce((s, c) => s + c.total, 0);

	return (
		<div className="flex items-center overflow-x-auto px-6 py-2.5 border-b border-border">
			{ITEMS.map((item, i) => (
				<div key={item.label} className="flex items-center">
					{i > 0 && (
						<span className="px-3 pb-3.5 text-lg text-dim">→</span>
					)}
					<div className="text-center min-w-20">
						<p
							className="font-display text-xl font-black leading-none"
							style={{ color: item.color }}
						>
							{sum(item.statuses)}
						</p>
						<p className="text-[10px] tracking-widest mt-0.5 text-muted">
							{item.label}
						</p>
					</div>
				</div>
			))}
		</div>
	);
};

export default PipelineStrip;
