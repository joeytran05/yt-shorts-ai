"use server";

import { revalidatePath } from "next/cache";
import { getIdea, setStatus, updateIdea } from "@/lib/supabase";
import { rewriteSEO } from "@/lib/ai";
import type { ActionResult, Idea } from "@/types";
import {
	getYouTubeAccessToken,
	getYouTubeAccessTokenForChannel,
} from "../youtube-auth";
import { getChannelForNiche } from "./channels";
import { performYouTubeUpload } from "@/lib/youtube-upload";

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
): Promise<ActionResult<Idea>> {
	const idea = await getIdea(ideaId);
	if (!idea?.final_video_url)
		return { ok: false, error: "No video file ready" };

	// Use the channel-specific token if a channel is configured for this niche
	const channel = idea.niche ? await getChannelForNiche(idea.niche) : null;
	const accessToken = channel?.refresh_token
		? await getYouTubeAccessTokenForChannel(channel.refresh_token)
		: await getYouTubeAccessToken();

	if (!accessToken)
		return { ok: false, error: "YOUTUBE_OAUTH_TOKEN not set" };

	await setStatus(ideaId, "uploading");
	revalidatePath("/dashboard");

	try {
		const { yt_video_id, yt_url } = await performYouTubeUpload(
			idea,
			accessToken,
		);

		const updated = await updateIdea(ideaId, {
			status: "published",
			yt_video_id,
			yt_url,
			published_at: new Date().toISOString(),
		});
		revalidatePath("/dashboard");
		return { ok: true, data: updated };
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
