import { createClient } from "@supabase/supabase-js";
import { planScenes } from "./scene-planner";
import { fetchAllClips } from "./pexels";
import { generateWordCaptions } from "./captions";
import { renderShortsVideo } from "./renderer";
import type { VideoScene, SceneData } from "../types/scenes";
import type { Idea } from "../types";
import { compressVideo } from "./compressor";
import { startClipServer } from "./clip-server";
import { fetchBackgroundMusic } from "./music-fetcher";
import { incrementRenderCount } from "../lib/quota";

function db() {
	return createClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

async function getIdea(id: string): Promise<Idea | null> {
	const { data } = await db().from("ideas").select("*").eq("id", id).single();
	return (data as Idea) ?? null;
}

async function patch(id: string, values: Record<string, unknown>) {
	const { error } = await db().from("ideas").update(values).eq("id", id);
	if (error) throw new Error(`DB patch failed: ${error.message}`);
}

// ── 3-checkpoint pipeline ─────────────────────────────────────────
// A: plan scenes  → saved to scene_data  ← retry resumes here
// B: fetch clips  → saved to scene_data  ← retry resumes here
// C: captions + render + upload (always runs, fast enough)
//
// After pipeline: status → 'produced'  (skips adding_captions stage)
//
export async function runVideoPipeline(
	ideaId: string,
	userId: string,
): Promise<void> {
	console.log(`[pipeline] Starting idea ${ideaId}`);

	const idea = await getIdea(ideaId);
	if (!idea) throw new Error("Idea not found");
	if (!idea.audio_url) throw new Error("No audio_url");
	if (!idea.script_full) throw new Error("No script_full");

	const durationSec = idea.script_duration_sec ?? 30;
	let sceneData: SceneData = (idea.scene_data as SceneData) ?? null;

	// ── CHECKPOINT A: Plan scenes ─────────────────────────────────
	if (!sceneData?.scenes?.length) {
		console.log("[pipeline] A: Planning scenes…");
		await patch(ideaId, { scenes_status: "planning" });

		const plans = await planScenes(idea);

		sceneData = {
			planned_at: new Date().toISOString(),
			scenes: plans.map((p) => ({
				index: p.index,
				text: p.text,
				visual_query: p.visual_query,
				clip_id: "",
				clip_url: "",
				clip_width: 1080,
				clip_height: 1920,
				clip_duration_sec: 0,
				alloc_sec: 0,
				start_sec: 0,
			})),
		};

		await patch(ideaId, {
			scene_data: sceneData,
			scenes_status: "planning",
		});
		console.log(`[pipeline] A: ${plans.length} scenes planned`);
	} else {
		console.log(
			`[pipeline] A: Skipped (${sceneData.scenes.length} scenes saved)`,
		);
	}

	// ── CHECKPOINT B: Fetch clips ─────────────────────────────────
	const missingClips = sceneData.scenes.filter((s) => !s.clip_url);

	if (missingClips.length > 0) {
		console.log(`[pipeline] B: Fetching ${missingClips.length} clips…`);
		await patch(ideaId, { scenes_status: "clips_fetching" });

		const clipMap = await fetchAllClips(missingClips, durationSec);

		for (const scene of sceneData.scenes) {
			if (scene.clip_url) continue;
			const clip = clipMap.get(scene.index);
			if (clip) {
				scene.clip_id = clip.id;
				scene.clip_url = clip.url;
				scene.clip_width = clip.width;
				scene.clip_height = clip.height;
				scene.clip_duration_sec = clip.duration;
			}
		}

		sceneData.clips_fetched_at = new Date().toISOString();
		await patch(ideaId, {
			scene_data: sceneData,
			scenes_status: "clips_ready",
		});

		const n = sceneData.scenes.filter((s) => s.clip_url).length;
		console.log(
			`[pipeline] B: ${n}/${sceneData.scenes.length} clips fetched`,
		);
	} else {
		console.log("[pipeline] B: Skipped (all clips saved)");
	}

	// ── CHECKPOINT C: Download → Captions + Music → Render ────────
	const timed = buildTimedScenes(
		sceneData.scenes.filter((s) => s.clip_url),
		durationSec,
	);
	if (timed.length === 0)
		throw new Error("Zero clips — check PEXELS_API_KEY");

	await patch(ideaId, {
		scenes_status: "rendering",
		render_started_at: new Date().toISOString(),
	});

	// Run all three in parallel — independent of each other
	console.log("[pipeline] C: Clip server + captions + music in parallel…");
	const [clipServer, captions, musicUrl] = await Promise.all([
		startClipServer(timed),
		generateWordCaptions(idea.audio_url!),
		idea.music_url ?? // manually selected - use directly
			(await fetchBackgroundMusic(
				idea.music_track ?? "background",
				durationSec,
				userId,
			)),
	]);

	// Save music_url to DB so it's visible in the dashboard
	if (musicUrl) {
		await patch(ideaId, { music_url: musicUrl });
	}

	// Use the actual audio length from Whisper timestamps as ground truth.
	// script_duration_sec is only an AI estimate — the real ElevenLabs audio
	// can be longer, which would cut the video short if we used the estimate.
	const audioDurationSec =
		captions.length > 0
			? captions[captions.length - 1].endMs / 1000 + 0.5 // +0.5s tail buffer
			: durationSec;
	const renderDurationSec = Math.max(durationSec, audioDurationSec);

	console.log(
		`[pipeline] C: ${captions.length} captions, audio=${audioDurationSec.toFixed(1)}s, render=${renderDurationSec.toFixed(1)}s, ` +
		`scenes=${clipServer.scenes.length}, music=${musicUrl ? "✓" : "none"}`,
	);

	// Re-time scenes to fill the actual audio duration
	const timedFinal = buildTimedScenes(
		clipServer.scenes,
		renderDurationSec,
	);

	let rawBuffer: Buffer;
	try {
		rawBuffer = await renderShortsVideo({
			scenes: timedFinal,
			audioUrl: idea.audio_url!,
			captions,
			musicUrl,
			totalDurationSec: renderDurationSec,
		});
	} finally {
		// Always shut down server + clean up regardless of render outcome
		await clipServer.shutdown();
		await clipServer.cleanup();
	}

	// ── Compress before upload ────────────────────────────────────
	console.log(
		`[pipeline] Compressing ${(rawBuffer.byteLength / 1_000_000).toFixed(1)}MB raw video…`,
	);
	const compressed = await compressVideo(rawBuffer);
	console.log(
		`[pipeline] Compressed to ${(compressed.byteLength / 1_000_000).toFixed(1)}MB`,
	);

	// ── Upload compressed video ───────────────────────────────────
	const fileName = `${userId}/videos/${ideaId}-${Date.now()}.mp4`;
	const client = db();

	const { error: upErr } = await client.storage
		.from("production-assets")
		.upload(fileName, compressed, {
			contentType: "video/mp4",
			upsert: true,
		});
	if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

	const { data: urlData } = client.storage
		.from("production-assets")
		.getPublicUrl(fileName);

	sceneData.scenes = timed;

	await patch(ideaId, {
		video_raw_url: urlData.publicUrl,
		video_captioned_url: urlData.publicUrl, // captions already burned in
		final_video_url: urlData.publicUrl,
		scenes_status: "done",
		scene_data: sceneData,
		status: "produced", // ← skip adding_captions stage entirely
		render_finished_at: new Date().toISOString(),
		render_error: null,
	});

	// ── Increment render quota counter ───────────────────────────
	await incrementRenderCount(
		userId,
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	);

	console.log(`[pipeline] Done → ${urlData.publicUrl}`);
}

function buildTimedScenes(
	scenes: VideoScene[],
	totalSec: number,
): VideoScene[] {
	const allocSec = totalSec / scenes.length;
	let cursor = 0;
	return scenes.map((s) => {
		const start = cursor;
		cursor += allocSec;
		return { ...s, alloc_sec: allocSec, start_sec: start };
	});
}
