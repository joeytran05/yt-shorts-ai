import { Suspense } from "react";
import { getIdeas, getPipelineCounts } from "@/lib/supabase";
import type { IdeaStatus } from "@/types";
import PipelineNav from "@/components/PipelineNav";
import PipelineStrip from "@/components/PipelineStrip";
import IdeaList from "@/components/IdeaList";
import { STAGE_GROUPS } from "@/constants";
import DiscoverButton from "@/components/DiscoverButton";

const STAGE_ICONS: Record<string, string> = {
	discover: "🔍",
	script: "✍️",
	produce: "🎬",
	review: "👀",
	publish: "🚀",
};

interface Props {
	searchParams: Promise<{ stage?: string }>;
}

const DashboardPage = async ({ searchParams }: Props) => {
	const stage = (await searchParams).stage ?? "discover";
	const stageGroup =
		STAGE_GROUPS.find((s) => s.id === stage) ?? STAGE_GROUPS[0];

	const [ideas, counts] = await Promise.all([
		getIdeas(stageGroup.statuses as IdeaStatus[]),
		getPipelineCounts(),
	]);

	return (
		<>
			{/* Topbar */}
			<header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-3.5 bg-bg border-b border-border">
				<div className="shrink-0">
					<p className="font-display text-lg font-black tracking-tight leading-none">
						<span className="text-danger">▶</span>
						SHORTS<span className="text-muted">.AI</span>
					</p>
					<p className="text-[10px] tracking-[0.15em] mt-0.5 text-muted">
						YOUTUBE SHORTS AI AGENT
					</p>
				</div>

				<Suspense fallback={<div className="flex-1" />}>
					<PipelineNav counts={counts} />
				</Suspense>

				<DiscoverButton />
			</header>

			{/* Pipeline strip */}
			<PipelineStrip counts={counts} />

			{/* Main */}
			<main className="max-w-265 mx-auto px-6 pt-5 pb-12">
				<div className="flex items-baseline justify-between mb-4">
					<div>
						<span
							className="text-sm font-semibold"
							style={{ color: stageGroup.color }}
						>
							{stageGroup.label}
						</span>
						<span className="text-xs ml-2.5 text-muted">
							{
								ideas.filter((i) => i.status !== "rejected")
									.length
							}{" "}
							ideas
						</span>
					</div>
				</div>

				<IdeaList
					initialIdeas={ideas}
					stageColor={stageGroup.color}
					stageLabel={stageGroup.label}
					emptyIcon={STAGE_ICONS[stage] ?? "📌"}
				/>
			</main>
		</>
	);
};

export default DashboardPage;
