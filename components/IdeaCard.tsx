"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Idea, IdeaStatus } from "@/types";
import { NICHE_EMOJI, STATUS_BADGE } from "@/constants";
import { STAGE_GROUPS } from "@/constants";
import ScoreRing from "./ScoreRing";
import PerformancePanel, { getPerformanceTag } from "./PerformancePanel";
import ScriptPanel from "./ScriptPanel";
import ProductionPanel from "./ProductionPanel";
import ActionButtons from "./ActionButtons";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import StageProgress, { Spinner } from "./StageProgress";

// ── Statuses where the pipeline is actively running ───────────────
const WORKING_STATUSES = new Set<IdeaStatus>([
	"approved",
	"generating_voice",
	"generating_video",
	"adding_captions",
	"uploading",
]);

// ── Statuses after which music can no longer be changed ───────────
const MUSIC_LOCKED_STATUSES = new Set<IdeaStatus>([
	"generating_video",
	"adding_captions",
	"produced",
	"changes_requested",
	"ready_to_publish",
	"scheduled",
	"uploading",
	"published",
]);

/** Map any status to its stage id (from STAGE_GROUPS). */
function statusToStage(status: IdeaStatus): string {
	for (const sg of STAGE_GROUPS) {
		if ((sg.statuses as readonly string[]).includes(status)) return sg.id;
	}
	return "discover";
}

interface Props {
	idea: Idea;
	stageColor: string;
	onUpdate: (updated: Idea) => void;
	onToast: (msg: string, ok: boolean) => void;
	/** Whether this card is currently checked in multi-select mode. */
	selected?: boolean;
	/** Called when the checkbox is toggled. */
	onToggleSelect?: () => void;
	/** Auto-expand the card on mount (used after navigate-and-focus). */
	defaultOpen?: boolean;
	/** When true, action buttons call tutorial helpers instead of real APIs. */
	isTutorial?: boolean;
}

const IdeaCard = ({
	idea,
	stageColor,
	onUpdate,
	onToast,
	selected,
	onToggleSelect,
	defaultOpen,
	isTutorial,
}: Props) => {
	const router = useRouter();
	const [open, setOpen] = useState(defaultOpen ?? isTutorial ?? false);
	const [local, setLocal] = useState(idea);

	// Sync when realtime pushes an update from outside
	if (
		idea.status !== local.status ||
		idea.scenes_status !== local.scenes_status
	) {
		setLocal(idea);
	}

	const badge = STATUS_BADGE[local.status] ?? {
		color: "var(--muted)",
		label: local.status,
	};
	const isWorking = WORKING_STATUSES.has(local.status);
	const musicLocked = MUSIC_LOCKED_STATUSES.has(local.status);

	const scoreColor =
		local.viral_score == null
			? "var(--muted)"
			: local.viral_score >= 70
				? "var(--publish)"
				: local.viral_score >= 50
					? "var(--review)"
					: "var(--danger)";

	const handleUpdate = (patch: Partial<Idea>) => {
		const updated = { ...local, ...patch } as Idea;
		setLocal(updated);
		onUpdate(updated);

		// Navigate to the stage that owns the new status (if it changed stages)
		if (patch.status && patch.status !== local.status) {
			const currentStage = statusToStage(local.status);
			const newStage = statusToStage(patch.status);
			// Don't navigate if the new stage is the same as the current or if it's "archive"
			if (newStage !== currentStage && newStage !== "archive") {
				// Include ?expand=<id> so the card auto-opens on the destination stage
				router.push(`/dashboard?stage=${newStage}&expand=${local.id}`, {
					scroll: false,
				});
			}
		}
	};

	// Performance tag — computed once before render (avoids impure Date.now() in JSX)
	const perfTag =
		local.status === "published" && local.yt_views != null
			? getPerformanceTag(local.yt_views)
			: null;

	return (
		<div
			className={`rounded-xl overflow-hidden transition-all duration-150 border
				${open ? "opacity-100 bg-card-hover border-border-active" : "bg-card border-border"}
				${local.status === "rejected" ? "opacity-35" : ""}`}
			style={{
				borderLeft: `3px solid ${stageColor}`,
			}}
		>
			{/* ── Header ── */}
			<div
				className="flex items-center gap-3 px-4 py-3 cursor-pointer"
				onClick={() => setOpen((o) => !o)}
			>
				{/* Multi-select checkbox */}
				{onToggleSelect && (
					<div
						className="shrink-0 flex items-center"
						onClick={(e) => e.stopPropagation()}
					>
						<Checkbox
							checked={selected ?? false}
							onCheckedChange={() => onToggleSelect()}
							className="cursor-pointer"
						/>
					</div>
				)}

				{local.thumbnail_url ? (
					<>
						<Image
							src={local.thumbnail_url}
							alt=""
							width={64}
							height={36}
							className="w-16 h-9 object-cover rounded-md shrink-0"
						/>
					</>
				) : (
					<div className="w-16 h-9 rounded-md shrink-0 flex items-center justify-center text-base bg-dim">
						{NICHE_EMOJI[local.niche] ?? "📌"}
					</div>
				)}

				<div className="flex-1 min-w-0">
					<p className="text-base font-semibold truncate text-text">
						{local.seo_title ?? local.title}
					</p>
					<div className="flex gap-2.5 mt-0.5 flex-wrap text-xs text-muted">
						<span>📺 {local.source_channel}</span>
						<span>👁 {fmt(local.source_views)}</span>
						<span>👍 {fmt(local.source_likes)}</span>
						{perfTag && (
							<>
								<span className="text-border">·</span>
								<span className="font-semibold text-publish">
									▶ {fmt(local.yt_views!)} views
								</span>
								{local.yt_likes != null && (
									<span className="text-publish">
										👍 {fmt(local.yt_likes)}
									</span>
								)}
								<span
									className="font-semibold"
									style={{ color: perfTag.color }}
								>
									{perfTag.label}
								</span>
							</>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2.5 shrink-0">
					{/* Spinner in header when working */}
					{isWorking && <Spinner color={badge.color} />}

					<Badge
						className="text-xs px-1.5 py-0.5"
						style={{
							background: `${badge.color}18`,
							color: badge.color,
							border: `1px solid ${badge.color}30`,
						}}
					>
						{badge.label}
					</Badge>
					<ScoreRing
						value={local.viral_score}
						color={scoreColor}
						size={36}
					/>
					{open ? (
						<ChevronUp size={14} className="text-muted" />
					) : (
						<ChevronDown size={14} className="text-muted" />
					)}
				</div>
			</div>

			{/* ── Expanded body ── */}
			{open && (
				<div className="px-4 pb-5 pt-4 animate-slide-up border-t border-border">
					<div className="grid grid-cols-2 gap-5">
						<PerformancePanel
							viral={local.viral_score}
							hook={local.hook_score}
							trend={local.trend_score}
							competition={local.competition_score}
							reasoning={local.ai_reasoning}
							views={local.yt_views}
							likes={local.yt_likes}
							comments={local.yt_comments}
							fetchedAt={local.yt_metrics_fetched_at}
							publishedAt={local.published_at}
						/>
						<ScriptPanel
							ideaId={local.id}
							scriptFull={local.script_full}
							durationSec={local.script_duration_sec}
							musicTrack={local.music_track}
							currentMusicUrl={local.music_url}
							musicLocked={musicLocked}
							onUpdate={handleUpdate}
							onToast={onToast}
						/>
					</div>

					{/* Stage progress indicator — driven by realtime */}
					<StageProgress
						status={local.status}
						scenesStatus={local.scenes_status}
					/>

					<ProductionPanel
						audioUrl={local.audio_url}
						videoUrl={local.final_video_url ?? local.video_raw_url}
					/>

					{local.last_error && (
						<div
							className="mt-3 rounded-md px-3 py-1.5 text-xs text-danger"
							style={{
								background: "rgba(239,68,68,0.08)",
								border: "1px solid rgba(239,68,68,0.22)",
							}}
						>
							⚠ {local.last_error}
						</div>
					)}

					{/* Links row */}
					<div className="flex items-center justify-between mt-3.5">
						<a
							href={local.source_url ?? "#"}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75 text-score"
						>
							View source <ExternalLink size={10} />
						</a>
						{local.yt_url && (
							<a
								href={local.yt_url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-75 text-publish"
							>
								🎬 View on YouTube <ExternalLink size={10} />
							</a>
						)}
					</div>

					{/* Hide action buttons while actively working */}
					{!isWorking && (
						<ActionButtons
							ideaId={local.id}
							status={local.status}
							hasAudio={!!local.audio_url}
							hasScript={!!local.script_full}
							hasVideo={!!local.final_video_url}
							hasPerformance={!!local.yt_views}
							onResult={onToast}
							onUpdate={handleUpdate}
							isTutorial={isTutorial}
						/>
					)}
				</div>
			)}
		</div>
	);
};

function fmt(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return String(n);
}

export default IdeaCard;
