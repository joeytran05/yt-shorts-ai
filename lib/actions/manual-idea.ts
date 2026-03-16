"use server";

import { revalidatePath } from "next/cache";
import { supabase, upsertIdea, updateIdea } from "@/lib/supabase";
import { fetchSingleVideo } from "@/lib/youtube-scraper";
import { batchScore, generateIdeaFromPrompt } from "@/lib/ai";
import { md5 } from "@/lib/utils";
import type { ActionResult, Idea, NicheType } from "@/types";

// Statuses that block re-adding the same URL (idea is already in active pipeline)
const ACTIVE_STATUSES = new Set([
	"approved",
	"scripted",
	"generating_voice",
	"generating_video",
	"adding_captions",
	"produced",
	"ready_to_publish",
	"changes_requested",
	"scheduled",
	"uploading",
	"published",
]);

// ── Parse a YouTube video ID from any URL format ─────────────────
function parseVideoId(raw: string): string | null {
	const patterns = [
		// youtube.com/shorts/ID
		/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
		// youtu.be/ID
		/youtu\.be\/([A-Za-z0-9_-]{11})/,
		// youtube.com/watch?v=ID
		/[?&]v=([A-Za-z0-9_-]{11})/,
		// bare 11-char ID
		/^([A-Za-z0-9_-]{11})$/,
	];
	for (const re of patterns) {
		const m = raw.trim().match(re);
		if (m) return m[1];
	}
	return null;
}

// ── Add idea from a YouTube Shorts URL ───────────────────────────
export async function addIdeaFromUrl(url: string): Promise<ActionResult<Idea>> {
	try {
		const videoId = parseVideoId(url);
		if (!videoId)
			return {
				ok: false,
				error: "Could not parse a YouTube video ID from that URL.",
			};

		// Check if it's already deep in the pipeline
		const hash = `${videoId}:`;
		const { data: existing } = await supabase
			.from("ideas")
			.select("id, status, content_hash")
			.ilike("content_hash", `${videoId}:%`)
			.maybeSingle();

		if (existing && ACTIVE_STATUSES.has(existing.status)) {
			return {
				ok: false,
				error: "This video is already in your active pipeline.",
			};
		}

		// Fetch from YouTube API
		const metadata = await fetchSingleVideo(videoId);
		if (!metadata)
			return {
				ok: false,
				error: "Video not found or is private/deleted.",
			};

		// Upsert (handles re-add of rejected/scored ideas cleanly)
		const saved = await upsertIdea({
			...(metadata as Partial<Idea> & { content_hash: string }),
			status: "discovered",
		});

		// AI score
		const [scored] = await batchScore([saved]);
		if (!scored) return { ok: false, error: "AI scoring failed." };

		const updated = await updateIdea(saved.id, {
			status: "scored",
			viral_score: Math.round(scored.viral_score ?? 0),
			hook_score: Math.round(scored.hook_score ?? 0),
			trend_score: Math.round(scored.trend_score ?? 0),
			competition_score: Math.round(scored.competition_score ?? 0),
		});

		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// ── Generate a structured idea from a free-text prompt ───────────
export async function generateIdeaAction(
	prompt: string,
	preferredNiche?: string,
): Promise<
	ActionResult<{
		title: string;
		hook: string;
		description: string;
		tags: string[];
		niche: NicheType;
	}>
> {
	try {
		if (!prompt.trim())
			return { ok: false, error: "Please describe your idea first." };

		const result = await generateIdeaFromPrompt(prompt, preferredNiche);
		return {
			ok: true,
			data: result as {
				title: string;
				hook: string;
				description: string;
				tags: string[];
				niche: NicheType;
			},
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// ── Save a manually-described idea into the pipeline ─────────────
export async function addIdeaFromText(data: {
	title: string;
	description: string;
	niche: NicheType;
	tags: string[];
	hook: string;
}): Promise<ActionResult<Idea>> {
	try {
		const hash = md5(`${data.title}:${data.description}`);

		// Check for exact duplicate
		const { data: existing } = await supabase
			.from("ideas")
			.select("id, status")
			.eq("content_hash", hash)
			.maybeSingle();

		if (existing && ACTIVE_STATUSES.has(existing.status)) {
			return {
				ok: false,
				error: "An identical idea is already in your active pipeline.",
			};
		}

		const saved = await upsertIdea({
			source: "manual",
			title: data.title,
			description: data.description,
			niche: data.niche,
			tags: data.tags,
			script_hook: data.hook,
			source_views: 0,
			source_likes: 0,
			source_comments: 0,
			status: "discovered",
			content_hash: hash,
		} as Partial<Idea> & { content_hash: string });

		// AI score
		const [scored] = await batchScore([saved]);
		if (!scored) return { ok: false, error: "AI scoring failed." };

		const updated = await updateIdea(saved.id, {
			status: "scored",
			viral_score: Math.round(scored.viral_score ?? 0),
			hook_score: Math.round(scored.hook_score ?? 0),
			trend_score: Math.round(scored.trend_score ?? 0),
			competition_score: Math.round(scored.competition_score ?? 0),
		});

		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
