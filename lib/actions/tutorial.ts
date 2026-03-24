"use server";

import { TUTORIAL_IDEA } from "@/constants";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/supabase";
import type { IdeaStatus } from "@/types";

// ── Tutorial state ─────────────────────────────────────────────────

/**
 * Returns the user's current tutorial step and their tutorial idea id (if any).
 * The idea id is resolved by looking for a row with content_hash = '__tutorial__'.
 */
export async function getTutorialState(): Promise<{
	step: string;
	ideaId: string | null;
}> {
	const { userId } = await getAuthContext();

	const [{ data: user }, { data: tutorialIdea }] = await Promise.all([
		db.from("users").select("onboarding_step").eq("id", userId).single(),
		db
			.from("ideas")
			.select("id")
			.eq("user_id", userId)
			.eq("content_hash", "__tutorial__")
			.maybeSingle(),
	]);

	return {
		step: user?.onboarding_step ?? "welcome",
		ideaId: tutorialIdea?.id ?? null,
	};
}

/** Persist the current tutorial step to the DB. */
export async function setTutorialStep(step: string): Promise<{ ok: boolean }> {
	try {
		const { userId } = await getAuthContext();
		await db
			.from("users")
			.update({ onboarding_step: step })
			.eq("id", userId);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

/**
 * Reset the tutorial back to 'welcome' and clean up any leftover tutorial idea.
 * Called from the Settings "Restart Tutorial" button.
 */
export async function resetTutorial(): Promise<{ ok: boolean }> {
	try {
		const { userId } = await getAuthContext();
		await Promise.all([
			db
				.from("users")
				.update({ onboarding_step: "welcome" })
				.eq("id", userId),
			db
				.from("ideas")
				.delete()
				.eq("user_id", userId)
				.eq("content_hash", "__tutorial__"),
		]);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

/**
 * Insert a pre-filled tutorial idea into the DB without calling any external APIs.
 * If one already exists for this user, returns its id without re-inserting.
 */
export async function seedTutorialIdea(): Promise<{
	ok: boolean;
	ideaId?: string;
	error?: string;
}> {
	try {
		const { userId } = await getAuthContext();

		// Re-use an existing tutorial idea if it's still there
		const { data: existing } = await db
			.from("ideas")
			.select("id")
			.eq("user_id", userId)
			.eq("content_hash", "__tutorial__")
			.single();

		if (existing) return { ok: true, ideaId: existing.id };

		const { data, error } = await db
			.from("ideas")
			.insert({
				...TUTORIAL_IDEA,
				user_id: userId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.select("id")
			.single();

		if (error) return { ok: false, error: error.message };
		return { ok: true, ideaId: data.id };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}

/**
 * Advance the tutorial idea to any status without calling external APIs.
 * Also populates status-specific fields so the UI looks realistic.
 */
export async function advanceTutorialIdea(
	ideaId: string,
	toStatus: IdeaStatus,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const { userId } = await getAuthContext();

		const patch: Record<string, unknown> = {
			status: toStatus,
			updated_at: new Date().toISOString(),
		};

		// Populate realistic fields depending on target status
		if (toStatus === "scripted") {
			patch.script_hook = TUTORIAL_IDEA.script_hook;
			patch.script_body = TUTORIAL_IDEA.script_body;
			patch.script_cta = TUTORIAL_IDEA.script_cta;
			patch.script_full = TUTORIAL_IDEA.script_full;
			patch.script_duration_sec = TUTORIAL_IDEA.script_duration_sec;
			patch.seo_title = TUTORIAL_IDEA.seo_title;
			patch.seo_description = TUTORIAL_IDEA.seo_description;
			patch.seo_tags = TUTORIAL_IDEA.seo_tags;
		}

		if (toStatus === "ready_to_publish") {
			// Simulate a produced video with a sample MP4 URL
			patch.final_video_url =
				"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
			patch.scenes_status = "done";
			patch.render_finished_at = new Date().toISOString();
		}

		const { error } = await db
			.from("ideas")
			.update(patch)
			.eq("id", ideaId)
			.eq("user_id", userId);

		if (error) return { ok: false, error: error.message };
		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}

/**
 * Delete the tutorial idea when the tour is completed or skipped.
 */
export async function cleanupTutorialIdea(
	ideaId: string,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const { userId } = await getAuthContext();
		const { error } = await db
			.from("ideas")
			.delete()
			.eq("id", ideaId)
			.eq("user_id", userId);

		if (error) return { ok: false, error: error.message };
		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}
