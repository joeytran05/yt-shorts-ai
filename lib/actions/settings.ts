"use server";

import { revalidatePath } from "next/cache";
import { getSettings, updateSettings, db, getMusicTracksForUser } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/quota";
import type { ActionResult, Settings, YoutubeQuery } from "@/types";
import type { Track } from "@/lib/supabase";

export async function fetchSettings(): Promise<ActionResult<Settings>> {
	try {
		const { userId } = await getAuthContext();
		const data = await getSettings(userId);
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
		const { userId, plan } = await getAuthContext();

		// Gate custom queries to paid plans (server-side enforcement)
		if (!PLAN_LIMITS[plan].customQueries && queries.some((q) => q.custom)) {
			return {
				ok: false,
				error: "Custom queries require a Starter or higher plan.",
			};
		}

		// Max 3 enabled queries across all plans
		const enabledCount = queries.filter((q) => q.enabled).length;
		if (enabledCount > 3) {
			return {
				ok: false,
				error: "Maximum 3 queries can be enabled at once.",
			};
		}

		const data = await updateSettings(userId, { youtube_queries: queries });
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
		const { userId } = await getAuthContext();
		// Clamp per_query to 1–3
		const safePatch = {
			...patch,
			per_query: Math.max(1, Math.min(3, patch.per_query)),
		};
		const data = await updateSettings(userId, safePatch);
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

export async function uploadMusicTrack(
	formData: FormData,
): Promise<ActionResult<Track>> {
	try {
		const { userId, plan } = await getAuthContext();

		// Gate music uploads to Pro+ plans
		if (!PLAN_LIMITS[plan].musicUpload) {
			return {
				ok: false,
				error: "Music uploads require a Pro or Business plan.",
			};
		}

		const file = formData.get("file") as File;
		const mood = formData.get("mood") as string;
		const name = formData.get("name") as string;

		if (!file) return { ok: false, error: "No file provided" };

		// Get duration from audio file
		const duration = await getAudioDuration(file);

		// Upload to Supabase Storage
		const fileName = `${userId}/music/${mood}-${Date.now()}-${file.name}`;
		const buf = await file.arrayBuffer();

		const { error: upErr } = await db.storage
			.from("production-assets")
			.upload(fileName, buf, {
				contentType: "audio/mpeg",
				upsert: false,
			});

		if (upErr) throw new Error(`Storage: ${upErr.message}`);

		const { data: urlData } = db.storage
			.from("production-assets")
			.getPublicUrl(fileName);

		// Save to music_tracks table scoped to this user
		const { data, error } = await db
			.from("music_tracks")
			.insert({ name, mood, url: urlData.publicUrl, duration, user_id: userId })
			.select()
			.single();

		if (error) throw new Error(error.message);

		revalidatePath("/settings");
		return { ok: true, data };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

export async function deleteMusicTrack(id: string): Promise<ActionResult> {
	try {
		const { userId } = await getAuthContext();

		// Only allow deleting own tracks (not system tracks where user_id IS NULL)
		const { data: track } = await db
			.from("music_tracks")
			.select("url, user_id")
			.eq("id", id)
			.eq("user_id", userId) // enforces ownership
			.single();

		if (!track) return { ok: false, error: "Track not found or not yours" };

		if (track.url) {
			// Extract storage path from URL
			const urlPath = new URL(track.url).pathname;
			const filePath = urlPath.split("/production-assets/")[1];
			if (filePath) {
				await db.storage.from("production-assets").remove([filePath]);
			}
		}

		await db.from("music_tracks").delete().eq("id", id).eq("user_id", userId);
		revalidatePath("/settings");
		return { ok: true, data: undefined };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

export async function getMusicTracks(): Promise<ActionResult<Track[]>> {
	try {
		const { userId } = await getAuthContext();
		const data = await getMusicTracksForUser(userId);
		return { ok: true, data };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// Read audio duration using Web Audio API (server-side via ArrayBuffer)
async function getAudioDuration(file: File): Promise<number> {
	try {
		// Approximate: file size / bitrate
		const sizeKB = file.size / 1024;
		return Math.round(sizeKB / 16); // ~128kbps = 16KB/s
	} catch {
		return 60; // fallback
	}
}
