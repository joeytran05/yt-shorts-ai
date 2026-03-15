import type { WordCaption } from "../types/scenes";

interface WhisperWord {
	word: string;
	start: number; // seconds
	end: number;   // seconds
}

interface WhisperVerboseResponse {
	words?: WhisperWord[];
}

// Call Whisper with word-level timestamps and return WordCaption[]
export async function generateWordCaptions(
	audioUrl: string,
): Promise<WordCaption[]> {
	console.log("[captions] Fetching audio for Whisper…");

	const audioRes = await fetch(audioUrl);
	if (!audioRes.ok)
		throw new Error(`Failed to fetch audio: ${audioRes.status}`);
	const audioBlob = await audioRes.blob();

	const fd = new FormData();
	fd.append("file", audioBlob, "audio.mp3");
	fd.append("model", "whisper-1");
	fd.append("response_format", "verbose_json");
	fd.append("timestamp_granularities[]", "word");
	fd.append("language", "en");

	console.log("[captions] Calling Whisper (word timestamps)…");
	const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
		method: "POST",
		headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
		body: fd,
	});

	if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);

	const data: WhisperVerboseResponse = await res.json();

	if (!data.words?.length) {
		console.warn("[captions] No word timestamps returned by Whisper");
		return [];
	}

	console.log(`[captions] Got ${data.words.length} word timestamps`);
	return data.words.map((w) => ({
		word: w.word.trim(),
		startMs: Math.round(w.start * 1000),
		endMs: Math.round(w.end * 1000),
	}));
}
