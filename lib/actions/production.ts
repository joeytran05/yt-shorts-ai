"use server";

import { revalidatePath } from "next/cache";
import {
	getIdea,
	setStatus,
	updateIdea,
	createProductionJob,
	completeProductionJob,
	failProductionJob,
	db,
} from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import { checkRenderQuota, PLAN_LIMITS } from "@/lib/quota";
import type { ActionResult, Idea } from "@/types";
import { enqueueVideoRender } from "../queue";

export async function generateVoiceover(
	ideaId: string,
	voiceId = "EXAVITQu4vr4xnSDxMaL",
): Promise<ActionResult<{ audio_url: string }>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	const idea = await getIdea(userId, ideaId);
	if (!idea?.script_full) return { ok: false, error: "No script found" };

	await setStatus(userId, ideaId, "generating_voice");
	const job = await createProductionJob(userId, ideaId, "voiceover", "elevenlabs");
	revalidatePath("/dashboard");

	try {
		const res = await fetch(
			`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"xi-api-key": process.env.ELEVENLABS_API_KEY!,
				},
				body: JSON.stringify({
					text: idea.script_full,
					model_id: "eleven_turbo_v2_5",
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75,
						style: 0.4,
						use_speaker_boost: true,
					},
				}),
			},
		);
		if (!res.ok)
			throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);

		const buf = await res.arrayBuffer();
		const fileName = `${userId}/voiceovers/${ideaId}-${Date.now()}.mp3`;

		const { error: upErr } = await db.storage
			.from("production-assets")
			.upload(fileName, buf, { contentType: "audio/mpeg", upsert: true });
		if (upErr) throw new Error(`Storage: ${upErr.message}`);

		const { data: urlData } = db.storage
			.from("production-assets")
			.getPublicUrl(fileName);
		const audio_url = urlData.publicUrl;

		await completeProductionJob(job.id, audio_url);
		await updateIdea(userId, ideaId, {
			audio_url,
			voice_id: voiceId,
			status: "scripted",
		});

		revalidatePath("/dashboard");
		return { ok: true, data: { audio_url } };
	} catch (err) {
		const error =
			err instanceof Error ? err.message : JSON.stringify(err, null, 2);

		await failProductionJob(job.id, error);
		await setStatus(userId, ideaId, "failed", { last_error: error });

		revalidatePath("/dashboard");
		return { ok: false, error };
	}
}

// Enqueue job → Railway worker handles the rest asynchronously
export async function generateVideo(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	let plan: import("@/lib/quota").PlanType;
	try {
		({ userId, plan } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	// Quota check before enqueuing
	const quotaErr = await checkRenderQuota(
		userId,
		plan,
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	);
	if (quotaErr) return { ok: false, error: quotaErr };

	const idea = await getIdea(userId, ideaId);
	if (!idea) return { ok: false, error: "Idea not found" };
	if (!idea.audio_url)
		return { ok: false, error: "No audio — generate voiceover first" };
	if (!idea.script_full) return { ok: false, error: "No script found" };

	try {
		const msgId = await enqueueVideoRender(ideaId, userId, PLAN_LIMITS[plan].queuePriority);

		const updated = await updateIdea(userId, ideaId, {
			status: "generating_video",
			scenes_status: "none",
			render_job_id: Number(msgId),
			render_error: null,
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

export async function approveProducedVideo(
	ideaId: string,
	notes?: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		const updated = await updateIdea(userId, ideaId, {
			status: "ready_to_publish",
			review_notes: notes ?? null,
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

export async function requestChanges(
	ideaId: string,
	notes: string,
): Promise<ActionResult<Idea>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		const updated = await updateIdea(userId, ideaId, {
			status: "changes_requested",
			review_notes: notes,
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

export async function setMusicTrack(
	ideaId: string,
	trackId: string | null, // null = use auto mood matching
): Promise<ActionResult<Idea>> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		let music_url: string | null = null;

		if (trackId) {
			// Only allow access to the user's own tracks or system tracks
			const { data: track } = await db
				.from("music_tracks")
				.select("url, name")
				.eq("id", trackId)
				.or(`user_id.eq.${userId},user_id.is.null`)
				.single();

			if (!track) return { ok: false, error: "Track not found" };
			music_url = track.url;
		}

		const updated = await updateIdea(userId, ideaId, { music_url });
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
