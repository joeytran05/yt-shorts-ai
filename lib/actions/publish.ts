"use server";

import { revalidatePath } from "next/cache";
import { getIdea, setStatus, updateIdea } from "@/lib/supabase";
import { rewriteSEO } from "@/lib/ai";
import { getAuthContext } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/quota";
import type { ActionResult, Idea } from "@/types";
import { getYouTubeAccessTokenForChannel } from "../youtube-auth";
import { getChannelForUser } from "./channels";
import { performYouTubeUpload } from "@/lib/youtube-upload";

export async function scheduleUpload(
	ideaId: string,
	scheduledAt: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	let plan: import("@/lib/quota").PlanType;
	try {
		({ userId, plan } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	// Gate scheduling to Pro+ plans
	if (!PLAN_LIMITS[plan].scheduling) {
		return {
			ok: false,
			error: "Scheduling requires a Pro or Business plan.",
		};
	}

	try {
		const updated = await updateIdea(userId, ideaId, {
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
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	const idea = await getIdea(userId, ideaId);
	if (!idea?.final_video_url)
		return { ok: false, error: "No video file ready" };

	// Resolve the user's connected YouTube channel
	const channel = await getChannelForUser(userId);
	if (!channel?.refresh_token) {
		return {
			ok: false,
			error:
				"No YouTube channel connected. Connect one in Settings to upload.",
		};
	}

	const accessToken = await getYouTubeAccessTokenForChannel(
		channel.refresh_token,
	);

	await setStatus(userId, ideaId, "uploading");
	revalidatePath("/dashboard");

	try {
		const { yt_video_id, yt_url } = await performYouTubeUpload(
			idea,
			accessToken,
		);

		const updated = await updateIdea(userId, ideaId, {
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
		await setStatus(userId, ideaId, "failed", { last_error: error });
		revalidatePath("/dashboard");
		return { ok: false, error };
	}
}

export async function rewriteIdeaSEO(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		const idea = await getIdea(userId, ideaId);
		if (!idea) return { ok: false, error: "Not found" };
		const seo = await rewriteSEO(idea);
		const updated = await updateIdea(userId, ideaId, seo);
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
