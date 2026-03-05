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
import { approveIdea, rejectIdea } from "@/lib/actions/script";
import {
	addCaptions,
	approveProducedVideo,
	generateVideo,
	generateVoiceover,
	requestChanges,
} from "@/lib/actions/production";
import { scheduleUpload, uploadToYouTube } from "@/lib/actions/publish";

interface Props {
	ideaId: string;
	status: IdeaStatus;
	hasAudio: boolean;
	onResult: (msg: string, ok: boolean) => void;
	onUpdate: (patch: Partial<Idea>) => void;
}

const ActionButtons = ({
	ideaId,
	status,
	hasAudio,
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

	// STAGE 2 — Trigger voiceover + video from scripted idea

	// STAGE 3 — Burn captions after video is rendered

	// STAGE 4 — Final review approve / request changes

	// STAGE 5 — Schedule or upload now
	return null;
};

function nextUTC(hour: number): string {
	const d = new Date();
	d.setUTCHours(hour, 0, 0, 0);
	if (d <= new Date()) d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString();
}

export default ActionButtons;
