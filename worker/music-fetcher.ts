import { createClient } from "@supabase/supabase-js";

const MOOD_MAP: Record<string, string[]> = {
	upbeat: ["upbeat", "energetic", "hype", "pump", "fast"],
	motivational: ["motivate", "inspire", "epic", "success", "hustle", "grind"],
	chill: ["chill", "calm", "relax", "soft", "gentle", "lofi", "lo-fi"],
	dramatic: ["dramatic", "cinematic", "intense", "tension", "serious"],
	funny: ["funny", "playful", "quirky", "comedy", "silly", "fun"],
	corporate: ["corporate", "business", "professional", "clean"],
};

function detectMood(suggestion: string): string {
	const s = suggestion.toLowerCase();
	for (const [mood, keywords] of Object.entries(MOOD_MAP)) {
		if (keywords.some((k) => s.includes(k))) return mood;
	}
	return "upbeat"; // default
}

export async function fetchBackgroundMusic(
	suggestion: string,
	targetDurationSec: number,
): Promise<string | null> {
	const mood = detectMood(suggestion);
	console.log(`[music] Suggestion: "${suggestion}" → mood: "${mood}"`);

	const db = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);

	// Try exact mood first, then fall back to any track
	const { data: tracks } = await db
		.from("music_tracks")
		.select("*")
		.eq("mood", mood)
		.order("duration");

	const pool = tracks?.length
		? tracks
		: ((await db.from("music_tracks").select("*").order("duration")).data ??
			[]);

	if (!pool.length) {
		console.warn(
			"[music] No tracks in library — upload some to music_tracks table",
		);
		return null;
	}

	// Pick track closest to target duration
	const best = pool.sort(
		(a, b) =>
			Math.abs(a.duration - targetDurationSec) -
			Math.abs(b.duration - targetDurationSec),
	)[0];

	console.log(
		`[music] Using "${best.name}" (${best.duration}s, mood: ${best.mood})`,
	);
	return best.url;
}
