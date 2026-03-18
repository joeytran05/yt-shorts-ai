"use server";

import { revalidatePath } from "next/cache";
import { db, updateIdea } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import type { ActionResult, Idea } from "@/types";

async function fetchYTStats(
	ytVideoId: string,
): Promise<{ views: number; likes: number; comments: number } | null> {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ytVideoId}&key=${process.env.YOUTUBE_API_KEY}`;
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) return null;
	const data = await res.json();
	const item = data?.items?.[0];
	if (!item) return null;
	return {
		views: parseInt(item.statistics.viewCount ?? "0", 10),
		likes: parseInt(item.statistics.likeCount ?? "0", 10),
		comments: parseInt(item.statistics.commentCount ?? "0", 10),
	};
}

export async function fetchVideoMetrics(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		const { data: idea, error: fetchErr } = await db
			.from("ideas")
			.select("yt_video_id")
			.eq("id", ideaId)
			.eq("user_id", userId)
			.single();

		if (fetchErr || !idea?.yt_video_id)
			return { ok: false, error: "No YouTube video ID found" };

		const stats = await fetchYTStats(idea.yt_video_id);
		if (!stats) return { ok: false, error: "Failed to fetch YouTube stats" };

		const updated = await updateIdea(userId, ideaId, {
			yt_views: stats.views,
			yt_likes: stats.likes,
			yt_comments: stats.comments,
			yt_metrics_fetched_at: new Date().toISOString(),
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

export async function refreshAllMetrics(): Promise<
	ActionResult<{ updated: number }>
> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		const { data: ideas, error } = await db
			.from("ideas")
			.select("id, yt_video_id")
			.eq("status", "published")
			.eq("user_id", userId)
			.not("yt_video_id", "is", null);

		if (error) throw new Error(error.message);
		if (!ideas?.length) return { ok: true, data: { updated: 0 } };

		let updated = 0;
		for (const idea of ideas) {
			const stats = await fetchYTStats(idea.yt_video_id);
			if (!stats) continue;
			await db
				.from("ideas")
				.update({
					yt_views: stats.views,
					yt_likes: stats.likes,
					yt_comments: stats.comments,
					yt_metrics_fetched_at: new Date().toISOString(),
				})
				.eq("id", idea.id)
				.eq("user_id", userId);
			updated++;
			// Small delay to avoid hammering the API
			await new Promise((r) => setTimeout(r, 300));
		}

		revalidatePath("/dashboard");
		return { ok: true, data: { updated } };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
