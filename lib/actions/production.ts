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
import type { ActionResult, Idea } from "@/types";

export async function generateVoiceover(
	ideaId: string,
	voiceId = "EXAVITQu4vr4xnSDxMaL",
): Promise<ActionResult<{ audio_url: string }>> {
	const idea = await getIdea(ideaId);
	if (!idea?.script_full) return { ok: false, error: "No script found" };

	await setStatus(ideaId, "generating_voice");
	const job = await createProductionJob(ideaId, "voiceover", "elevenlabs");
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
		const fileName = `voiceovers/${ideaId}-${Date.now()}.mp3`;

		const { error: upErr } = await db.storage
			.from("production-assets")
			.upload(fileName, buf, { contentType: "audio/mpeg", upsert: true });
		if (upErr) throw new Error(`Storage: ${upErr.message}`);

		const { data: urlData } = db.storage
			.from("production-assets")
			.getPublicUrl(fileName);
		const audio_url = urlData.publicUrl;

		await completeProductionJob(job.id, audio_url);
		await updateIdea(ideaId, {
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
		await setStatus(ideaId, "failed", { last_error: error });

		revalidatePath("/dashboard");
		return { ok: false, error };
	}
}

