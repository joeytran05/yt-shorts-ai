"use server";

import { revalidatePath } from "next/cache";
import { getIdea, setStatus, updateIdea } from "@/lib/supabase";
import { rewriteSEO } from "@/lib/ai";
import type { ActionResult, Idea } from "@/types";
import { getYouTubeAccessToken } from "../youtube-auth";

export async function scheduleUpload(
	ideaId: string,
	scheduledAt: string,
): Promise<ActionResult<Idea>> {
	try {
		const updated = await updateIdea(ideaId, {
			status: "scheduled",
			scheduled_at: scheduledAt,
		});
		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error
					? err.message
					: JSON.stringify(err, null, 2),
		};
	}
}

export async function uploadToYouTube(
	ideaId: string,
): Promise<ActionResult<{ yt_url: string }>> {
	const idea = await getIdea(ideaId);
	if (!idea?.final_video_url)
		return { ok: false, error: "No video file ready" };

	const accessToken = await getYouTubeAccessToken();

	if (!accessToken)
		return { ok: false, error: "YOUTUBE_OAUTH_TOKEN not set" };

	await setStatus(ideaId, "uploading");
	revalidatePath("/dashboard");

	try {
		const videoRes = await fetch(idea.final_video_url);
		const videoBlob = await videoRes.blob();
		const title = (idea.seo_title ?? idea.title).slice(0, 100);
		const description = [
			idea.seo_description ?? "",
			"",
			idea.seo_hashtags?.join(" ") ?? "",
		]
			.join("\n")
			.trim();
		const tags = [...(idea.seo_tags ?? []), "Shorts", "viral"].slice(
			0,
			500,
		);

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
		if (!uploadUrl) throw new Error("No upload URL from YouTube");

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

		await updateIdea(ideaId, {
			status: "published",
			yt_video_id,
			yt_url,
			published_at: new Date().toISOString(),
		});
		revalidatePath("/dashboard");
		return { ok: true, data: { yt_url } };
	} catch (err) {
		const error =
			err instanceof Error ? err.message : JSON.stringify(err, null, 2);
		await setStatus(ideaId, "failed", { last_error: error });
		revalidatePath("/dashboard");
		return { ok: false, error };
	}
}

export async function rewriteIdeaSEO(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	try {
		const idea = await getIdea(ideaId);
		if (!idea) return { ok: false, error: "Not found" };
		const seo = await rewriteSEO(idea);
		const updated = await updateIdea(ideaId, seo);
		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error
					? err.message
					: JSON.stringify(err, null, 2),
		};
	}
}
