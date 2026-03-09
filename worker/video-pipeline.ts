import { createClient } from "@supabase/supabase-js";
import { planScenes } from "./scene-planner";
import { fetchAllClips } from "./pexels";
import { generateCaptions } from "./captions"; // ← new
import { renderShortsVideo } from "./renderer";
import type { VideoScene, SceneData } from "../types/scenes";
import type { Idea } from "../types";

function db() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
export async function runVideoPipeline(ideaId: string): Promise<void> {
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

	// ── CHECKPOINT C: Captions + Render ──────────────────────────
	const timed = buildTimedScenes(
		sceneData.scenes.filter((s) => s.clip_url),
		durationSec,
	);
	if (timed.length === 0)
		throw new Error("Zero clips — check PEXELS_API_KEY");

	// Generate captions via Whisper (runs in parallel with render prep)
	console.log("[pipeline] C: Generating captions + rendering…");
	await patch(ideaId, {
		scenes_status: "rendering",
		render_started_at: new Date().toISOString(),
	});

	const captions = await generateCaptions(idea.audio_url!);
	console.log(`[pipeline] C: ${captions.length} caption entries`);

	const buffer = await renderShortsVideo({
		scenes: timed,
		audioUrl: idea.audio_url!,
		captions, // ← passed to Remotion
		totalDurationSec: durationSec,
	});

	// ── Upload to Supabase Storage ────────────────────────────────
	const fileName = `videos/${ideaId}-${Date.now()}.mp4`;
	const client = db();

	const { error: upErr } = await client.storage
		.from("production-assets")
		.upload(fileName, buffer, { contentType: "video/mp4", upsert: true });
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
