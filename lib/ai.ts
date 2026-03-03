import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, Output } from "ai";
import { z } from "zod";
import type { Idea, ScoreResult, ScriptResult, NicheType } from "@/types";
import { google } from "@ai-sdk/google";
import { sleep } from "./utils";

// const MODEL = "claude-sonnet-4-20250514";
const MODEL = "gemini-3-flash-preview";

const ScoreSchema = z.object({
	viral_score: z.number().int().min(0).max(100),
	hook_score: z.number().int().min(0).max(100),
	trend_score: z.number().int().min(0).max(100),
	competition_score: z.number().int().min(0).max(100),
	ai_reasoning: z.string(),
	niche: z.enum([
		"life_hacks",
		"funny_fails",
		"motivation",
		"tech_tips",
		"diy",
		"asmr",
		"fitness",
		"finance",
		"food",
		"travel",
		"gaming",
		"beauty",
		"pets",
		"education",
		"news",
		"other",
	]),
	seo_title: z.string().max(100),
	seo_description: z.string().max(200),
	seo_tags: z.array(z.string()).max(10),
	seo_hashtags: z.array(z.string()).max(5),
});

const ScriptSchema = z.object({
	script_hook: z.string(),
	script_body: z.string(),
	script_cta: z.string(),
	script_full: z.string(),
	script_duration_sec: z.number().int().min(15).max(60),
	music_suggestion: z.string(),
});

const SeoSchema = z.object({
	seo_title: z.string().max(100),
	seo_description: z.string().max(200),
	seo_tags: z.array(z.string()).max(10),
	seo_hashtags: z.array(z.string()).max(5),
});

// ── Score a single idea ──────────────────────────────────────────

export async function scoreIdea(idea: Partial<Idea>): Promise<ScoreResult> {
	try {
		// Engagement rate = (likes + comments) / views
		const engRate = idea.source_views
			? (
					(((idea.source_likes ?? 0) + (idea.source_comments ?? 0)) /
						idea.source_views) *
					100
				).toFixed(2)
			: "0";

		const { output } = await generateText({
			model: google(MODEL),
			output: Output.object({ schema: ScoreSchema }),
			prompt: `You are an elite YouTube Shorts growth strategist. Score this video's remake potential.
	
				VIDEO:
				Title: ${idea.title}
				Channel: ${idea.source_channel}
				Views: ${idea.source_views?.toLocaleString()}
				Likes: ${idea.source_likes?.toLocaleString()}
				Comments: ${idea.source_comments?.toLocaleString()}
				Engagement rate: ${engRate}% (above 5% = excellent)
				Tags: ${idea.tags?.slice(0, 5).join(", ") ?? "none"}
	
				SCORING:
				- viral_score: Overall remake potential. Views + engagement + universal appeal.
				- hook_score: How clickable the concept is as a title/thumbnail hook.
				- trend_score: Trend health (100=rising, 50=evergreen, 0=dying).
				- competition_score: 100=low competition (GOOD), 0=totally saturated.
	
				Be accurate and critical. A 1M view video with 0.5% engagement scores lower than 100K views with 8%.`,
		});

		return output as ScoreResult;
	} catch (err) {
		console.error("[scoreIdea] failed for idea", idea.id, "error:", err);
		throw err;
	}
}

// ── Batch score ideas (3 concurrent) ────────────────────────────

export async function batchScore(
	ideas: Partial<Idea>[],
	onProgress?: (n: number, total: number) => void,
): Promise<(Partial<Idea> & ScoreResult)[]> {
	const results: (Partial<Idea> & ScoreResult)[] = [];
	console.log("scoring");
	for (let i = 0; i < ideas.length; i += 3) {
		const batch = ideas.slice(i, i + 3);
		const settled = await Promise.allSettled(
			batch.map((idea) =>
				scoreIdea(idea).then((score) => ({ ...idea, ...score })),
			),
		);
		settled.forEach((r) => {
			if (r.status === "fulfilled") results.push(r.value);
			else console.error("[batchScore] failed:", r.reason);
		});
		onProgress?.(Math.min(results.length, ideas.length), ideas.length);
		if (i + 3 < ideas.length) await sleep(300);
	}

	return results;
}
