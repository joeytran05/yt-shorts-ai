"use server";

import { revalidatePath } from "next/cache";
import { runFullDiscovery, DEFAULT_QUERIES } from "@/lib/youtube-scraper";
import { batchScore } from "@/lib/ai";
import { upsertIdea, startScrapeRun, endScrapeRun } from "@/lib/supabase";
import type { ActionResult, DiscoverResult, Idea } from "@/types";

export async function discoverIdeas(
	formData?: FormData,
): Promise<ActionResult<DiscoverResult>> {
	const t0 = Date.now();
	const queries = DEFAULT_QUERIES;
	const minViews = parseInt(
		(formData?.get("min_views") as string) ?? "100000",
	);

	const run = await startScrapeRun(queries.slice(0, 5));

	try {
		const raw = await runFullDiscovery(queries, { minViews, perQuery: 1 });
		const scored = await batchScore(raw);
		console.log(scored);

		let newCount = 0;
		const saved = [];
		for (const idea of scored) {
			if (!idea.content_hash) continue;
			const record = await upsertIdea({
				...idea,
				content_hash: idea.content_hash,
				status: "scored",
			} as Partial<Idea> & { content_hash: string });
			saved.push(record);
			if (Date.now() - new Date(record.created_at).getTime() < 60_000)
				newCount++;
		}

		const duration_ms = Date.now() - t0;
		await endScrapeRun(run.id, {
			ideas_found: raw.length,
			ideas_new: newCount,
			duration_ms,
		});
		revalidatePath("/dashboard");

		return {
			ok: true,
			data: {
				run_id: run.id,
				found: raw.length,
				new_ideas: newCount,
				ideas: saved,
				duration_ms,
			},
		};
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		await endScrapeRun(run.id, {
			ideas_found: 0,
			ideas_new: 0,
			duration_ms: Date.now() - t0,
			status: "failed",
			error_msg: error,
		});
		return { ok: false, error };
	}
}
