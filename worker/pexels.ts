import { PexelsClip, ScenePlan } from "../types/scenes";

const PEXELS_BASE = "https://api.pexels.com/v1/videos";

interface PexelsVideoFile {
	id: number;
	quality: string;
	width: number;
	height: number;
	link: string;
}

interface PexelsVideo {
	id: number;
	duration: number;
	video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
	videos: PexelsVideo[];
}

export async function fetchPexelsClip(
	query: string,
	minDurationSec = 4,
	attempt = 0,
): Promise<PexelsClip | null> {
	const params = new URLSearchParams({
		query,
		orientation: "portrait",
		size: "medium",
		per_page: "10",
	});

	let res: Response;
	try {
		res = await fetch(`${PEXELS_BASE}/search?${params}`, {
			headers: { Authorization: process.env.PEXELS_API_KEY! },
		});
	} catch {
		return null;
	}

	if (res.status === 429) {
		if (attempt < 1) {
			await sleep(2000);
			return fetchPexelsClip(query, minDurationSec, 1);
		}
		return null;
	}

	if (!res.ok) return null;

	const data: PexelsSearchResponse = await res.json();

	if (!data.videos?.length) {
		const fallback = query.split(" ")[0];
		if (attempt === 0 && fallback !== query)
			return fetchPexelsClip(fallback, minDurationSec, 1);
		return null;
	}

	for (const video of data.videos) {
		if (video.duration < minDurationSec) continue;
		const file = pickBestFile(video.video_files);
		if (!file) continue;
		return {
			id: String(video.id),
			url: file.link,
			width: file.width,
			height: file.height,
			duration: video.duration,
		};
	}

	if (attempt === 0 && minDurationSec > 2)
		return fetchPexelsClip(query, 2, 1);

	return null;
}

export async function fetchAllClips(
	scenes: ScenePlan[],
	totalDurationSec: number,
): Promise<Map<number, PexelsClip | null>> {
	const result = new Map<number, PexelsClip | null>();
	const allocSec = totalDurationSec / scenes.length;
	const minDur = Math.max(2, Math.round(allocSec - 1));

	for (let i = 0; i < scenes.length; i += 4) {
		const batch = scenes.slice(i, i + 4);
		const settled = await Promise.allSettled(
			batch.map((s) => fetchPexelsClip(s.visual_query, minDur)),
		);
		batch.forEach((s, j) => {
			const r = settled[j];
			result.set(s.index, r.status === "fulfilled" ? r.value : null);
		});
		if (i + 4 < scenes.length) await sleep(250);
	}

	return result;
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
	if (!files?.length) return null;

	return (
		[...files]
			.filter((f) => {
				if (f.link.includes(".m3u8")) return false; // no HLS
				// Cap at 1080p — reject anything wider than 1920 or taller than 1920
				// Pexels 4K files are 3840x2160 or 2160x3840 — these crash Chromium
				const maxDim = Math.max(f.width, f.height);
				return maxDim <= 1920;
			})
			.sort((a, b) => {
				// Portrait first
				const ap = a.height > a.width ? 1 : 0;
				const bp = b.height > b.width ? 1 : 0;
				if (ap !== bp) return bp - ap;

				// HD quality string preferred
				const ah = a.quality === "hd" ? 1 : 0;
				const bh = b.quality === "hd" ? 1 : 0;
				if (ah !== bh) return bh - ah;

				// Highest resolution within the cap
				return b.height - a.height;
			})[0] ?? null
	);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
