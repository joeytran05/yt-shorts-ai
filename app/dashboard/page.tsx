import { Suspense } from "react";
import { getIdeas, getPipelineCounts, getDiscoveryCooldown } from "@/lib/supabase";
import type { IdeaStatus } from "@/types";
import PipelineNav from "@/components/PipelineNav";
import PipelineStrip from "@/components/PipelineStrip";
import IdeaList from "@/components/IdeaList";
import { STAGE_GROUPS } from "@/constants";
import DiscoverButton from "@/components/DiscoverButton";
import AddIdeaPanel from "@/components/AddIdeaPanel";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureUserExists } from "@/lib/actions/onboarding";
import { getAuthContext } from "@/lib/auth";
import { PlanBadge } from "@/components/PlanBadge";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton, Show } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

const STAGE_ICONS: Record<string, string> = {
	discover: "🔍",
	script: "✍️",
	produce: "🎬",
	review: "👀",
	publish: "🚀",
	archive: "🗂",
};

interface Props {
	searchParams: Promise<{ stage?: string; expand?: string }>;
}

const DashboardPage = async ({ searchParams }: Props) => {
	const { userId } = await auth();
	if (!userId) redirect("/");

	// Resolve plan + ensure DB user row exists (both read Clerk session)
	const [{ plan }, user] = await Promise.all([
		getAuthContext(),
		ensureUserExists(),
	]);

	const { stage: rawStage, expand } = await searchParams;
	const stage = rawStage ?? "discover";
	const stageGroup =
		STAGE_GROUPS.find((s) => s.id === stage) ?? STAGE_GROUPS[0];

	const [rawIdeas, counts, discoveryCooldown] = await Promise.all([
		getIdeas(user.id, stageGroup.statuses as IdeaStatus[]),
		getPipelineCounts(user.id),
		getDiscoveryCooldown(user.id),
	]);

	// In the archive: failed ideas surface first (they need attention),
	// then rejected ideas below.
	const ideas =
		stage === "archive"
			? [...rawIdeas].sort((a, b) => {
					if (a.status === "failed" && b.status !== "failed")
						return -1;
					if (a.status !== "failed" && b.status === "failed")
						return 1;
					return 0;
				})
			: rawIdeas;

	return (
		<>
			{/* Topbar */}
			<header className="sticky top-0 z-40 flex flex-wrap items-center gap-4 px-6 py-3.5 bg-bg border-b border-border">
				<div className="shrink-0">
					<p className="font-display text-lg font-black tracking-tight leading-none">
						<span className="text-danger">▶</span>
						SHORTS<span className="text-muted">.AI</span>
					</p>
					<p className="text-[10px] tracking-[0.15em] mt-0.5 text-muted">
						YOUTUBE SHORTS AI AGENT
					</p>
				</div>

				<div className="hidden md:block">
					<Suspense fallback={<div className="flex-1" />}>
						<PipelineNav counts={counts} />
					</Suspense>
				</div>

				<div className="hidden lg:flex gap-4">
					<DiscoverButton nextDiscoveryAt={discoveryCooldown} />
					<AddIdeaPanel userPlan={plan} />
				</div>

				<Button
					variant="outline"
					className="hover:bg-neutral-800 ml-auto"
				>
					<Link
						href="/settings"
						className="flex items-center gap-1.5 transition-opacity hover:opacity-75 shrink-0 text-muted"
					>
						<Settings size={13} />
						Settings
					</Link>
				</Button>
				<div className="flex items-center gap-4">
					<PlanBadge />
					<Show when="signed-in">
						<UserButton
							fallback={
								<Skeleton className="w-7 h-7 rounded-full bg-muted" />
							}
						/>
					</Show>
				</div>
			</header>

			<div className="md:hidden not-sm:flex not-sm:justify-center px-6 py-3.5 bg-bg border-b border-border">
				<Suspense fallback={<div className="flex-1" />}>
					<PipelineNav counts={counts} />
				</Suspense>
			</div>

			<div className="flex justify-center border-b border-border sm:justify-between">
				{/* Pipeline strip */}
				<PipelineStrip counts={counts} />
				<div className="gap-4 px-6 py-4 hidden sm:max-lg:flex">
					<DiscoverButton nextDiscoveryAt={discoveryCooldown} />
					<AddIdeaPanel userPlan={plan} />
				</div>
			</div>

			{/* Main */}
			<main className="max-w-265 min-w-212.5 mx-auto px-6 pt-5 pb-12">
				<div className="flex items-baseline justify-between mb-4">
					<div>
						<span
							className="text-sm font-semibold"
							style={{ color: stageGroup.color }}
						>
							{stageGroup.label}
						</span>
						<span className="text-xs ml-2.5 text-muted">
							{stage === "archive"
								? ideas.length
								: ideas.filter(
										(i) =>
											i.status !== "rejected" &&
											i.status !== "failed",
									).length}{" "}
							ideas
						</span>
					</div>

					<div className="flex sm:hidden gap-4">
						<DiscoverButton nextDiscoveryAt={discoveryCooldown} />
						<AddIdeaPanel userPlan={plan} />
					</div>
				</div>

				<IdeaList
					initialIdeas={ideas}
					stageColor={stageGroup.color}
					stageLabel={stageGroup.label}
					emptyIcon={STAGE_ICONS[stage] ?? "📌"}
					expandId={expand}
				/>
			</main>
		</>
	);
};

export default DashboardPage;
