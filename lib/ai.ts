import { anthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, Output } from "ai";
import { z } from "zod";
import type { Idea, ScoreResult, ScriptResult } from "@/types";
import { openai } from "@ai-sdk/openai";

// const MODEL = "claude-sonnet-4-20250514";
// const MODEL = "gemini-3-flash-preview";
const MODEL = "gpt-5-nano";

const ScoreSchema = z.object({
	scores: z.array(
		z.object({
			id: z.string(),
			viral_score: z.number().min(0).max(100),
			hook_score: z.number().min(0).max(100),
			trend_score: z.number().min(0).max(100),
			competition_score: z.number().min(0).max(100),
		}),
	),
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

// ── Score ideas in batch ────────────────────────

export async function scoreIdeasBatch(
	ideas: Partial<Idea>[],
): Promise<(Partial<Idea> & ScoreResult)[]> {
	if (!ideas.length) return [];

	const compactIdeas = ideas.map((idea) => {
		const engRate = idea.source_views
			? (((idea.source_likes ?? 0) + (idea.source_comments ?? 0)) /
					idea.source_views) *
				100
			: 0;

		return {
			id: idea.id,
			title: idea.title,
			views: idea.source_views,
			likes: idea.source_likes,
			comments: idea.source_comments,
			engagement_rate: Number(engRate.toFixed(2)),
			channel: idea.source_channel,
		};
	});

	const { output } = await generateText({
		model: openai(MODEL),

		output: Output.object({ schema: ScoreSchema }),

		prompt: `You are an elite YouTube Shorts growth strategist.

			Your job is to evaluate REMAKE potential for each idea.

			Score each idea from 0–100.

			Scoring rules:

			- viral_score:
			Based on views, engagement rate, and mass appeal.
			High views with LOW engagement should score lower than moderate views with HIGH engagement.

			- hook_score:
			How strong and clickable the core concept is as a Short.
			Is it emotionally triggering? Curiosity-driven? Instantly understandable?

			- trend_score:
			100 = rapidly rising trend
			50 = evergreen
			0 = dying or outdated

			- competition_score:
			100 = low competition (GOOD)
			0 = extremely saturated niche

			IMPORTANT:
			- Use the EXACT "id" string from each input object.
			- Be critical.
			- Do NOT inflate scores.
			- Not all ideas deserve high scores.
			- Use full range (0–100).
			- Compare ideas relative to each other within this batch.

			Return STRICT JSON only.

			IDEAS:
			${JSON.stringify(compactIdeas, null, 2)}
			`,
	});

	// Map results back to original ideas
	const ideaMap = new Map(ideas.map((i) => [i.id, i]));

	return output.scores.map((score) => {
		const original = ideaMap.get(score.id);
		if (!original) throw new Error("Invalid ID returned by AI");
		return { ...original, ...score };
	});
}

}


export async function batchScore(
	ideas: Partial<Idea>[],
	onProgress?: (n: number, total: number) => void,
): Promise<(Partial<Idea> & ScoreResult)[]> {
	const results: (Partial<Idea> & ScoreResult)[] = [];
	console.log(ideas.length);

	// Score in batch at a time to balance speed and reliability
	for (let i = 0; i < ideas.length; i += 12) {
		const batch = ideas.slice(i, i + 12);
		try {
			const scored = await scoreIdeasBatch(batch);
			results.push(...scored);
		} catch (err) {
			console.error("[batchScore] failed batch:", err);
		}

		onProgress?.(results.length, ideas.length);
	}

	return results;
}
