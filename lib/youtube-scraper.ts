import type { Idea, YTSearchResponse, YTVideoResponse } from "@/types";
import { chunk, daysAgo, md5, sleep } from "./utils";

const YT = "https://www.googleapis.com/youtube/v3";
const KEY = () => process.env.YOUTUBE_API_KEY!;

// export const DEFAULT_QUERIES = [
// 	// Proven viral formats to copy
// 	"life hacks shorts viral",
// 	"satisfying shorts viral 2024",
// 	"mind blowing facts shorts",
// 	"things you didnt know shorts",
// 	"before after transformation shorts",
// 	"funny fails shorts viral",
// 	"food hack shorts",
// 	"money saving tips shorts",
// 	"fitness tips shorts viral",
// 	"tech tricks iphone shortcuts shorts",
// 	// International → copy to EN/VN
// 	"japanese life hacks shorts",
// 	"korean beauty tips shorts",
// 	"unexpected moments shorts",
// 	"motivation quote shorts viral",
// ];

export async function searchViralShorts(
	query: string,
	maxResults = 20,
	minViews = 100000,
): Promise<Partial<Idea>[]> {
	// Search for shorts matching the query, sorted by view count
	console.log("searching youtube for", maxResults);
	const searchParams = new URLSearchParams({
		part: "snippet",
		q: `${query} #shorts`,
		type: "video",
		videoDuration: "short",
		order: "viewCount",
		maxResults: String(maxResults),
		publishedAfter: daysAgo(90),
		key: KEY(),
	});

	// Search results into array of video IDs
	const sr = await fetch(`${YT}/search?${searchParams}`);
	if (!sr.ok)
		throw new Error(`YT Search failed: ${sr.status} ${await sr.text()}`);
	const sd = await sr.json();
	const ids: string[] = (sd.items ?? [])
		.map((i: YTSearchResponse) => i.id?.videoId)
		.filter(Boolean);
	if (!ids.length) return [];

	// Stats of these videos to filter by minViews and get details
	const vp = new URLSearchParams({
		part: "snippet,statistics",
		id: ids.join(","),
		key: KEY(),
	});
	const vr = await fetch(`${YT}/videos?${vp}`);
	if (!vr.ok) throw new Error("YT Videos failed");
	const vd = await vr.json();

	return (vd.items ?? [])
		.filter(
			(v: YTVideoResponse) =>
				parseInt(v.statistics?.viewCount ?? "0") >= minViews,
		)
		.map((v: YTVideoResponse) => ({
			source: "youtube" as const,
			source_video_id: v.id,
			source_url: `https://www.youtube.com/shorts/${v.id}`,
			source_channel: v.snippet.channelTitle,
			source_views: parseInt(v.statistics.viewCount ?? "0"),
			source_likes: parseInt(v.statistics.likeCount ?? "0"),
			source_comments: parseInt(v.statistics.commentCount ?? "0"),
			title: v.snippet.title,
			description: v.snippet.description?.slice(0, 500) ?? null,
			thumbnail_url: v.snippet.thumbnails?.high?.url ?? null,
			tags: v.snippet.tags?.slice(0, 10) ?? [],
			status: "discovered" as const,
			content_hash: md5(`${v.id}:${v.snippet.title}`),
		}));
}

/**
 * Fetch metadata for a single YouTube video by ID.
 * Used by the manual "Add by URL" flow.
 */
export async function fetchSingleVideo(
	videoId: string,
): Promise<Partial<Idea> | null> {
	const vp = new URLSearchParams({
		part: "snippet,statistics",
		id: videoId,
		key: KEY(),
	});
	const vr = await fetch(`${YT}/videos?${vp}`);
	if (!vr.ok) throw new Error(`YT Videos failed: ${vr.status}`);
	const vd = await vr.json();

	const v: YTVideoResponse | undefined = vd.items?.[0];
	if (!v) return null;

	return {
		source: "youtube" as const,
		source_video_id: v.id,
		source_url: `https://www.youtube.com/shorts/${v.id}`,
		source_channel: v.snippet.channelTitle,
		source_views: parseInt(v.statistics?.viewCount ?? "0"),
		source_likes: parseInt(v.statistics?.likeCount ?? "0"),
		source_comments: parseInt(v.statistics?.commentCount ?? "0"),
		title: v.snippet.title,
		description: v.snippet.description?.slice(0, 500) ?? null,
		thumbnail_url: v.snippet.thumbnails?.high?.url ?? null,
		tags: v.snippet.tags?.slice(0, 10) ?? [],
		status: "discovered" as const,
		content_hash: md5(`${v.id}:${v.snippet.title}`),
	};
}

export async function runFullDiscovery(
	queries: string[],
	options: { minViews?: number; perQuery?: number } = {},
): Promise<Partial<Idea>[]> {
	const { minViews = 100000, perQuery = 15 } = options;
	const all: Partial<Idea>[] = [];

	// 5 at a time to respect quota
	for (const batch of chunk(queries, 5)) {
		const results = await Promise.allSettled(
			batch.map((q) => searchViralShorts(q, perQuery, minViews)),
		);
		for (const r of results) {
			if (r.status === "fulfilled") all.push(...r.value);
		}
		await sleep(300);
	}

	// Deduplicate
	const seen = new Set<string>();
	return all.filter((i) => {
		if (!i.content_hash || seen.has(i.content_hash)) return false;
		seen.add(i.content_hash);
		return true;
	});
}
