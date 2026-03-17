/**
 * Core YouTube upload logic — shared between the Next.js server action
 * (lib/actions/publish.ts) and the worker scheduler (worker/scheduler.ts).
 *
 * Intentionally has NO "use server" directive and NO @/ path-alias imports
 * so the worker can import it with a relative path without type resolution issues.
 */

/** Minimal subset of Idea fields needed to perform an upload. */
export interface UploadableIdea {
	final_video_url: string | null;
	title: string;
	seo_title?: string | null;
	seo_description?: string | null;
	seo_hashtags?: string[] | null;
	seo_tags?: string[] | null;
}

export interface UploadResult {
	yt_video_id: string;
	yt_url: string;
}

/**
 * Performs a resumable YouTube upload for the given idea.
 * Throws on any non-2xx response.
 */
export async function performYouTubeUpload(
	idea: UploadableIdea,
	accessToken: string,
): Promise<UploadResult> {
	if (!idea.final_video_url)
		throw new Error("No video file attached to this idea");

	// ── Fetch the video bytes ──────────────────────────────────────
	const videoRes = await fetch(idea.final_video_url);
	if (!videoRes.ok)
		throw new Error(
			`Failed to fetch video (${videoRes.status}): ${idea.final_video_url}`,
		);
	const videoBlob = await videoRes.blob();

	// ── Build metadata ─────────────────────────────────────────────
	const title = (idea.seo_title ?? idea.title).slice(0, 100);
	const description = [
		idea.seo_description ?? "",
		"",
		idea.seo_hashtags?.join(" ") ?? "",
	]
		.join("\n")
		.trim();
	const tags = [...(idea.seo_tags ?? []), "Shorts", "viral"].slice(0, 500);

	// ── Step 1: initiate resumable upload ─────────────────────────
	const initRes = await fetch(
		"https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"X-Upload-Content-Type": "video/mp4",
				"X-Upload-Content-Length": String(videoBlob.size),
			},
			body: JSON.stringify({
				snippet: {
					title,
					description,
					tags,
					categoryId: "22",
					defaultLanguage: "en",
				},
				status: {
					privacyStatus: "public",
					selfDeclaredMadeForKids: false,
				},
			}),
		},
	);
	if (!initRes.ok)
		throw new Error(
			`YT init ${initRes.status}: ${await initRes.text()}`,
		);

	const uploadUrl = initRes.headers.get("Location");
	if (!uploadUrl) throw new Error("No upload URL returned by YouTube");

	// ── Step 2: upload the bytes ───────────────────────────────────
	const uploadRes = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			"Content-Type": "video/mp4",
			"Content-Length": String(videoBlob.size),
		},
		body: videoBlob,
	});
	if (!uploadRes.ok)
		throw new Error(
			`YT upload ${uploadRes.status}: ${await uploadRes.text()}`,
		);

	const ytData = await uploadRes.json();
	const yt_video_id = ytData.id as string;
	const yt_url = `https://www.youtube.com/shorts/${yt_video_id}`;

	return { yt_video_id, yt_url };
}
