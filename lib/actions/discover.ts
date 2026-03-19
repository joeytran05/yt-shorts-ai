"use server";

import { revalidatePath } from "next/cache";
import { runFullDiscovery } from "@/lib/youtube-scraper";
import { batchScore } from "@/lib/ai";
import {
	upsertIdea,
	startScrapeRun,
	endScrapeRun,
	updateIdea,
	db,
	getSettings,
	getDiscoveryCooldown,
} from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import type { ActionResult, DiscoverResult, Idea } from "@/types";

// Statuses considered "early stage" — safe to overwrite on re-discovery
const OVERWRITABLE_STATUSES = new Set(["discovered", "scored", "rejected"]);

export async function discoverIdeas(
	formData?: FormData,
): Promise<ActionResult<DiscoverResult>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	const t0 = Date.now();

	// 12-hour cooldown — applies to all plans
	const cooldownUntil = await getDiscoveryCooldown(userId);
	if (cooldownUntil) {
		const remaining = new Date(cooldownUntil);
		const h = Math.floor(
			(remaining.getTime() - Date.now()) / (1000 * 60 * 60),
		);
		const m = Math.floor(
			((remaining.getTime() - Date.now()) % (1000 * 60 * 60)) /
				(1000 * 60),
		);
		return {
			ok: false,
			error: `Discovery is on cooldown. Next run available in ${h}h ${m}m.`,
		};
	}

	// Load queries + options from settings
	const settings = await getSettings(userId);
	const queries = settings.youtube_queries
		.filter((q) => q.enabled)
		.map((q) => q.query);

	if (queries.length === 0) {
		return {
			ok: false,
			error: "No queries enabled — add some in Settings",
		};
	}

	const minViews = parseInt(
		(formData?.get("min_views") as string) ?? String(settings.min_views),
	);
	const perQuery = settings.per_query;
	const run = await startScrapeRun(userId, queries.slice(0, 5));

	try {
		// 1. Scrape raw ideas
		const raw = await runFullDiscovery(queries, { minViews, perQuery });

		// 2. Save to DB to get IDs for scoring
		const savedRecords: Idea[] = [];
		let newCount = 0;

		// Load existing ideas for this user to protect advanced statuses
		const hashes = raw
			.map((i) => i.content_hash)
			.filter(Boolean) as string[];

		const { data: existing } = await db
			.from("ideas")
			.select("id, content_hash, status")
			.in("content_hash", hashes)
			.eq("user_id", userId);

		const existingMap = new Map(
			(existing ?? []).map((e) => [e.content_hash, e.status]),
		);

		let skipped = 0;

		for (const idea of raw) {
			if (!idea.content_hash) continue;

			const existingStatus = existingMap.get(idea.content_hash);

			// Skip ideas that progressed past scoring
			if (existingStatus && !OVERWRITABLE_STATUSES.has(existingStatus)) {
				skipped++;
				continue;
			}

			const record = await upsertIdea(userId, {
				...idea,
				content_hash: idea.content_hash,
				status: "discovered",
			} as Partial<Idea> & { content_hash: string });

			savedRecords.push(record);

			if (!existingStatus) newCount++;
		}

		// 3. Now batch score using DB IDs
		const scored = await batchScore(savedRecords);

		// 4. Update DB with scores
		const updated: Idea[] = [];

		for (const idea of scored) {
			const record = await updateIdea(userId, idea.id!, {
				viral_score: Math.round(idea.viral_score),
				hook_score: Math.round(idea.hook_score),
				trend_score: Math.round(idea.trend_score),
				competition_score: Math.round(idea.competition_score),
				status: "scored",
			});

			updated.push(record);
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
				skipped,
				ideas: updated,
				duration_ms,
			},
		};
	} catch (err) {
		console.error("FULL ERROR:", err);

		const error =
			err instanceof Error ? err.message : JSON.stringify(err, null, 2);

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
