"use server";

import { revalidatePath } from "next/cache";
import { getSettings, updateSettings } from "@/lib/supabase";
import type { ActionResult, Settings, YoutubeQuery } from "@/types";

export async function fetchSettings(): Promise<ActionResult<Settings>> {
	try {
		const data = await getSettings();
		return { ok: true, data };
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

export async function saveQueries(
	queries: YoutubeQuery[],
): Promise<ActionResult<Settings>> {
	try {
		const data = await updateSettings({ youtube_queries: queries });
		revalidatePath("/settings");
		return { ok: true, data };
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

export async function saveGeneralSettings(
	patch: Pick<
		Settings,
		"min_views" | "per_query" | "auto_approve_above" | "target_niches"
	>,
): Promise<ActionResult<Settings>> {
	try {
		const data = await updateSettings(patch);
		revalidatePath("/settings");
		return { ok: true, data };
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
