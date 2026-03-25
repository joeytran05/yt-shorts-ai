/**
 * Scheduled upload checker — runs inside the worker poll loop.
 *
 * Queries for ideas whose status is "scheduled" and scheduled_at <= now(),
 * then performs the YouTube upload for each one sequentially.
 */

import { createClient } from "@supabase/supabase-js";
import { getYouTubeAccessTokenForChannel } from "../lib/youtube-auth";
import {
	performYouTubeUpload,
	type UploadableIdea,
} from "../lib/youtube-upload";

/** Minimal Idea fields the scheduler needs — avoids importing the full type. */
interface ScheduledIdea extends UploadableIdea {
	id: string;
	title: string;
	user_id: string;
}

function db() {
	return createClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

/**
 * Find all ideas that are due for upload and process them one by one.
 * Called from the worker poll loop, throttled to ~once per minute.
 */
export async function checkScheduledUploads(): Promise<void> {
	const now = new Date().toISOString();

	const { data: ideas, error } = await db()
		.from("ideas")
		.select("*")
		.eq("status", "scheduled")
		.lte("scheduled_at", now);

	if (error) {
		console.error("[scheduler] Query error:", error.message);
		return;
	}
	if (!ideas?.length) return;

	console.log(
		`\n[scheduler] ${ideas.length} idea(s) due for upload at ${now}`,
	);

	for (const idea of ideas as ScheduledIdea[]) {
		await uploadScheduledIdea(idea);
	}
}

async function uploadScheduledIdea(idea: ScheduledIdea): Promise<void> {
	console.log(`[scheduler] → Uploading idea ${idea.id}: "${idea.title}"`);

	// ── Claim the idea immediately to prevent double-upload if the
	//    worker restarts mid-run ────────────────────────────────────
	const { error: claimErr } = await db()
		.from("ideas")
		.update({ status: "uploading" })
		.eq("id", idea.id)
		.eq("status", "scheduled"); // only update if still scheduled

	if (claimErr) {
		console.error(
			`[scheduler] Could not claim idea ${idea.id}:`,
			claimErr.message,
		);
		return;
	}

	try {
		// ── Resolve YouTube access token from user's connected channel ──
		const { data: channel } = await db()
			.from("channels")
			.select("refresh_token")
			.eq("user_id", idea.user_id)
			.maybeSingle();

		if (!channel?.refresh_token)
			throw new Error(
				"No YouTube channel connected. Connect a channel in Settings.",
			);

		const accessToken = await getYouTubeAccessTokenForChannel(
			channel.refresh_token,
		);

		if (!accessToken)
			throw new Error("Failed to obtain YouTube access token");

		// ── Perform the upload ─────────────────────────────────────────
		const { yt_video_id, yt_url } = await performYouTubeUpload(
			idea,
			accessToken,
		);

		await db()
			.from("ideas")
			.update({
				status: "published",
				yt_video_id,
				yt_url,
				published_at: new Date().toISOString(),
			})
			.eq("id", idea.id);

		console.log(
			`[scheduler] ✓ Published idea ${idea.id} → ${yt_url}`,
		);
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		console.error(
			`[scheduler] ✗ Upload failed for idea ${idea.id}:`,
			error,
		);

		await db()
			.from("ideas")
			.update({ status: "failed", last_error: error })
			.eq("id", idea.id);
	}
}
