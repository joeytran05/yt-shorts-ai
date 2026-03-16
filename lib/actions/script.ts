"use server";

import { revalidatePath } from "next/cache";
import { generateScript } from "@/lib/ai";
import { getIdea, setStatus, updateIdea } from "@/lib/supabase";
import type { ActionResult, Idea } from "@/types";

export async function approveIdea(ideaId: string): Promise<ActionResult<Idea>> {
	try {
		const idea = await getIdea(ideaId);
		if (!idea) return { ok: false, error: "Idea not found" };

		await setStatus(ideaId, "approved");
		revalidatePath("/dashboard");

		const script = await generateScript(idea);

		const updated = await updateIdea(ideaId, {
			status: "scripted",
			script_hook: script.script_hook,
			script_body: script.script_body,
			script_cta: script.script_cta,
			script_full: script.script_full,
			script_duration_sec: script.script_duration_sec,

			seo_title: script.seo_title,
			seo_description: script.seo_description,
			seo_tags: script.seo_tags,

			niche: script.niche,
			music_track: script.music_suggestion,
		});

		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		console.error("FULL ERROR:", err);
		const error =
			err instanceof Error ? err.message : JSON.stringify(err, null, 2);

		await setStatus(ideaId, "failed", { last_error: error });
		revalidatePath("/dashboard");
		return { ok: false, error };
	}
}

export async function rejectIdea(
	ideaId: string,
	reason?: string,
): Promise<ActionResult<Idea>> {
	try {
		const updated = await updateIdea(ideaId, {
			status: "rejected",
			rejection_reason: reason ?? null,
		});
		revalidatePath("/dashboard");
		return { ok: true, data: updated };
	} catch (err) {
		console.error("FULL ERROR:", err);
		return {
			ok: false,
			error:
				err instanceof Error
					? err.message
					: JSON.stringify(err, null, 2),
		};
	}
}

export async function retryIdea(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	try {
		const idea = await getIdea(ideaId);
		if (!idea) return { ok: false, error: "Idea not found" };

		// Walk back to the last checkpoint that has data,
		// so the user re-triggers only the step that failed.
		let restoreStatus: Idea["status"];
		if (!idea.script_full) {
			restoreStatus = "scored"; // failed while scripting → re-approve
		} else if (!idea.audio_url) {
			restoreStatus = "scripted"; // failed before voice → retry voice
		} else if (!idea.final_video_url) {
			restoreStatus = "scripted"; // failed during render → retry video
		} else {
			restoreStatus = "ready_to_publish"; // failed during upload → retry upload
		}

		const updated = await updateIdea(ideaId, {
			status: restoreStatus,
			last_error: null,
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

export async function restoreIdea(
	ideaId: string,
): Promise<ActionResult<Idea>> {
	try {
		const updated = await updateIdea(ideaId, {
			status: "scored",
			rejection_reason: null,
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

export async function updateScript(
	ideaId: string,
	patch: Partial<Idea>,
): Promise<ActionResult<Idea>> {
	try {
		const updated = await updateIdea(ideaId, patch);
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
