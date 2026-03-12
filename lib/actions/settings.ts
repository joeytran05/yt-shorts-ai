"use server";

import { revalidatePath } from "next/cache";
import { getSettings, updateSettings, db, supabase } from "@/lib/supabase";
import type { ActionResult, Settings, YoutubeQuery } from "@/types";
import { Track } from "@/components/MusicLibrary";

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

export async function uploadMusicTrack(
	formData: FormData,
): Promise<ActionResult<Track>> {
	try {
		const file = formData.get("file") as File;
		const mood = formData.get("mood") as string;
		const name = formData.get("name") as string;

		if (!file) return { ok: false, error: "No file provided" };

		// Get duration from audio file
		const duration = await getAudioDuration(file);

		// Upload to Supabase Storage
		const fileName = `music/${mood}-${Date.now()}-${file.name}`;
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

		// Save to music_tracks table
		const { data, error } = await db
			.from("music_tracks")
			.insert({ name, mood, url: urlData.publicUrl, duration })
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
		// Get URL to also delete from storage
		const { data: track } = await supabase
			.from("music_tracks")
			.select("url")
			.eq("id", id)
			.single();

		if (track?.url) {
			// Extract storage path from URL
			const urlPath = new URL(track.url).pathname;
			const filePath = urlPath.split("/production-assets/")[1];
			if (filePath) {
				await db.storage.from("production-assets").remove([filePath]);
			}
		}

		await db.from("music_tracks").delete().eq("id", id);
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
		const { data, error } = await supabase
			.from("music_tracks")
			.select("id, name, mood, url, duration")
			.order("mood")
			.order("name");

		if (error) throw new Error(error.message);
		return { ok: true, data: data ?? [] };
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
		// Parse MP3 header to estimate duration
		// Approximate: file size / bitrate
		const sizeKB = file.size / 1024;
		return Math.round(sizeKB / 16); // ~128kbps = 16KB/s
	} catch {
		return 60; // fallback
	}
}
