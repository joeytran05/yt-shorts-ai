"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ELEVENLABS_VOICES, OPTIMAL_UPLOAD_TIMES } from "@/types";
import type { IdeaStatus, Idea } from "@/types";
import { approveIdea, rejectIdea, restoreIdea, retryIdea } from "@/lib/actions/script";
import {
	approveProducedVideo,
	generateVideo,
	generateVoiceover,
	requestChanges,
} from "@/lib/actions/production";
import { scheduleUpload, uploadToYouTube } from "@/lib/actions/publish";
import { fetchVideoMetrics } from "@/lib/actions/performance";

interface Props {
	ideaId: string;
	status: IdeaStatus;
	hasAudio: boolean;
	hasScript: boolean;
	hasVideo: boolean;
	hasPerformance: boolean;
	onResult: (msg: string, ok: boolean) => void;
	onUpdate: (patch: Partial<Idea>) => void;
}

const ActionButtons = ({
	ideaId,
	status,
	hasAudio,
	hasScript,
	hasVideo,
	hasPerformance,
	onResult,
	onUpdate,
}: Props) => {
	const [isPending, startTransition] = useTransition();
	const [rejectReason, setRejectReason] = useState("");
	const [voiceId, setVoiceId] = useState(ELEVENLABS_VOICES[0].id);
	const [scheduleTime, setScheduleTime] = useState("");

	const run = (
		fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>,
	) =>
		startTransition(async () => {
			const result = await fn();
			if (!result.ok) onResult(`✗ ${result.error}`, false);
			else {
				onResult("Done ✓", true);
				if (result.data) onUpdate(result.data);
			}
		});

	// STAGE 1 — Approve / Reject scored idea
	if (status === "scored" || status === "discovered")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 flex-wrap border-t border-border">
				<Input
					value={rejectReason}
					onChange={(e) => setRejectReason(e.target.value)}
					placeholder="Rejection reason (optional)"
					className="h-8 text-xs flex-1 min-w-40"
				/>
				<Button
					variant="ghost"
					size="sm"
					disabled={isPending}
					className="hover:bg-gray-700"
					onClick={() => run(() => rejectIdea(ideaId, rejectReason))}
				>
					✕ Reject
				</Button>
				<Button
					size="sm"
					disabled={isPending}
					className="font-bold bg-publish text-[#071a10] hover:bg-publish/90"
					onClick={() => run(() => approveIdea(ideaId))}
				>
					{isPending ? "⏳ Scripting…" : "✓ Approve → Script"}
				</Button>
			</div>
		);

	// STAGE 2 — Trigger voiceover + video + captions from scripted idea
	if (status === "scripted")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 flex-wrap border-t border-border">
				<Select value={voiceId} onValueChange={setVoiceId}>
					<SelectTrigger className="h-8 text-xs w-48 hover:bg-gray-800">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-bg border border-border">
						{ELEVENLABS_VOICES.map((v) => (
							<SelectItem
								key={v.id}
								value={v.id}
								className="border-b border-border last:border-0 hover:bg-gray-800"
							>
								{v.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					size="sm"
					disabled={isPending}
					className="bg-prod text-white hover:bg-prod/90"
					onClick={() =>
						run(() => generateVoiceover(ideaId, voiceId))
					}
				>
					🎤 Generate Voice
				</Button>
				{hasAudio && (
					<Button
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={() => run(() => generateVideo(ideaId))}
					>
						🎬 Generate Video
					</Button>
				)}
			</div>
		);

	// STAGE 3 — Final review approve / request changes
	if (status === "produced")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 border-t border-border">
				<Button
					size="sm"
					variant="outline"
					disabled={isPending}
					onClick={() =>
						run(() => requestChanges(ideaId, "Needs revision"))
					}
					className="hover:bg-gray-800"
				>
					✏ Request Changes
				</Button>
				<Button
					size="sm"
					disabled={isPending}
					className="bg-publish text-[#071a10] hover:bg-publish/90"
					onClick={() => run(() => approveProducedVideo(ideaId))}
				>
					✓ Approve Video
				</Button>
			</div>
		);

	// STAGE 4 — Schedule or upload now
	if (status === "ready_to_publish" || status === "changes_requested")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 flex-wrap border-t border-border">
				<Select value={scheduleTime} onValueChange={setScheduleTime}>
					<SelectTrigger className="h-8 text-xs w-52 hover:bg-gray-800">
						<SelectValue placeholder="Pick upload time…" />
					</SelectTrigger>
					<SelectContent className="bg-bg border border-border">
						{OPTIMAL_UPLOAD_TIMES.map((t) => (
							<SelectItem
								key={t.utc_hour}
								value={nextUTC(t.utc_hour)}
								className="border-b border-border last:border-0 hover:bg-gray-800"
							>
								{t.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					size="sm"
					variant="outline"
					disabled={isPending || !scheduleTime}
					onClick={() =>
						run(() => scheduleUpload(ideaId, scheduleTime))
					}
					className="hover:bg-gray-800"
				>
					📅 Schedule
				</Button>
				<Button
					size="sm"
					disabled={isPending}
					className="bg-publish text-[#071a10] hover:bg-publish/90"
					onClick={() => run(() => uploadToYouTube(ideaId))}
				>
					🚀 Upload Now
				</Button>
			</div>
		);

	// FAILED — retry from the last successful checkpoint
	if (status === "failed") {
		const retryLabel = !hasScript
			? "↺ Retry Scripting"
			: !hasAudio
				? "↺ Retry Voice"
				: !hasVideo
					? "↺ Retry Video Render"
					: "↺ Retry Upload";

		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 border-t border-border">
				<Button
					size="sm"
					disabled={isPending}
					className="bg-danger text-white hover:bg-danger/90 font-semibold"
					onClick={() => run(() => retryIdea(ideaId))}
				>
					{isPending ? "⏳ Retrying…" : retryLabel}
				</Button>
			</div>
		);
	}

	// ARCHIVE — restore a rejected idea back to the Discover stage
	if (status === "rejected")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 border-t border-border">
				<Button
					size="sm"
					disabled={isPending}
					className="bg-score text-black hover:bg-score/90 font-semibold"
					onClick={() => run(() => restoreIdea(ideaId))}
				>
					{isPending ? "⏳ Restoring…" : "↩ Restore to Discover"}
				</Button>
			</div>
		);

	// PUBLISHED — refresh metrics from YouTube Analytics
	if (status === "published")
		return (
			<div className="flex items-center gap-2 pt-3.5 mt-3.5 border-t border-border">
				<Button
					size="sm"
					variant="outline"
					disabled={isPending}
					className={`hover:bg-gray-800 text-muted ${hasPerformance ? "" : "animate-pulse"}`}
					onClick={() => run(() => fetchVideoMetrics(ideaId))}
				>
					{isPending ? "⏳ Fetching…" : "📊 Refresh Metrics"}
				</Button>
			</div>
		);

	return null;
};

function nextUTC(hour: number): string {
	const d = new Date();
	d.setUTCHours(hour, 0, 0, 0);
	if (d <= new Date()) d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString();
}

export default ActionButtons;
