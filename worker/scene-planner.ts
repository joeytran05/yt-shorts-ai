import { Idea } from "../types";
import { ScenePlan } from "../types/scenes";
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

const ScenePlanSchema = z.object({
	scenes: z
		.array(
			z.object({
				index: z.number().int().min(0),
				text: z.string(),
				visual_query: z.string(),
			}),
		)
		.min(3)
		.max(12),
});

export async function planScenes(idea: Idea): Promise<ScenePlan[]> {
	if (!idea.script_full) throw new Error("No script to plan scenes from");

	const durationSec = idea.script_duration_sec ?? 30;
	const targetScenes = Math.max(3, Math.min(12, Math.round(durationSec / 5)));

	const { output } = await generateText({
		model: openai("gpt-5-nano"),
		output: Output.object({ schema: ScenePlanSchema }),
		prompt: `Split this YouTube Shorts voiceover script into visual scenes for a stock video montage.

			SCRIPT:
			${idea.script_full}

			TOTAL DURATION: ${durationSec} seconds
			NICHE: ${idea.niche}
			TARGET SCENES: ${targetScenes} (~${Math.round(durationSec / targetScenes)}s each)

			RULES:
			1. Split at natural sentence or thought boundaries — never mid-sentence
			2. text = exact spoken words for that scene (no stage directions)
			3. visual_query = Pexels stock video search, 2-5 words, concrete nouns/verbs
			4. index is 0-based and sequential

			GOOD queries:  "hands chopping vegetables", "city traffic aerial", "person running park"
			BAD queries:   "healthy lifestyle", "success mindset", "motivation"`,
	});

	return output.scenes;
}
