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
): Promise<ActionResult> {
	try {
		await setStatus(ideaId, "rejected", {
			rejection_reason: reason ?? null,
		});
		revalidatePath("/dashboard");
		return { ok: true, data: undefined };
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
