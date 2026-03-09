import type { CaptionEntry } from "../types/scenes";

// Call Whisper and return parsed caption entries
export async function generateCaptions(
	audioUrl: string,
): Promise<CaptionEntry[]> {
	console.log("[captions] Fetching audio for Whisper…");

	const audioRes = await fetch(audioUrl);
	if (!audioRes.ok)
		throw new Error(`Failed to fetch audio: ${audioRes.status}`);
	const audioBlob = await audioRes.blob();

	const fd = new FormData();
	fd.append("file", audioBlob, "audio.mp3");
	fd.append("model", "whisper-1");
	fd.append("response_format", "srt");
	fd.append("language", "en");

	console.log("[captions] Calling Whisper…");
	const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
		method: "POST",
		headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
		body: fd,
	});

	if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);

	const srt = await res.text();
	console.log("[captions] Parsing SRT…");
	return parseSRT(srt);
}

// ── SRT parser → CaptionEntry[] ──────────────────────────────────
// SRT format:
//   1
//   00:00:00,000 --> 00:00:02,500
//   Hello world
//
function parseSRT(srt: string): CaptionEntry[] {
	const entries: CaptionEntry[] = [];

	// Split on double newline (block separator)
	const blocks = srt.trim().split(/\n\n+/);

	for (const block of blocks) {
		const lines = block.trim().split("\n");
		if (lines.length < 3) continue;

		// Line 0: index (ignore)
		// Line 1: timestamps
		// Line 2+: text
		const timeLine = lines[1];
		const text = lines.slice(2).join(" ").trim();

		const match = timeLine.match(
			/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/,
		);
		if (!match || !text) continue;

		const startMs = toMs(match[1], match[2], match[3], match[4]);
		const endMs = toMs(match[5], match[6], match[7], match[8]);

		entries.push({ startMs, endMs, text });
	}

	return entries;
}

function toMs(h: string, m: string, s: string, ms: string): number {
	return (
		parseInt(h) * 3_600_000 +
		parseInt(m) * 60_000 +
		parseInt(s) * 1_000 +
		parseInt(ms)
	);
}
