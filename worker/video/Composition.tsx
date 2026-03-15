import React from "react";
import {
	AbsoluteFill,
	OffthreadVideo,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from "remotion";
import type {
	ShortsCompositionProps,
	VideoScene,
	WordCaption,
} from "../../types/scenes";
import { Audio } from "@remotion/media";

// ── Caption chunk: words shown together, never crossing a sentence ─
interface CaptionChunk {
	words: WordCaption[];
	startMs: number;
	endMs: number;
}

// Max words to show at once within one sentence group
const MAX_WORDS_PER_CHUNK = 5;

/**
 * Split captions into display chunks that respect sentence boundaries.
 * Step 1 — split all words into sentences on punctuation (. ! ? …).
 * Step 2 — if a sentence is longer than MAX_WORDS_PER_CHUNK, split it
 *           into sub-chunks, but NEVER mix words from two sentences.
 */
function buildSentenceChunks(captions: WordCaption[]): CaptionChunk[] {
	// ── Step 1: gather sentences ───────────────────────────────────
	const sentences: WordCaption[][] = [];
	let current: WordCaption[] = [];

	for (const word of captions) {
		current.push(word);
		if (/[.!?…]+$/.test(word.word.trim())) {
			sentences.push(current);
			current = [];
		}
	}
	if (current.length > 0) sentences.push(current); // trailing words

	// ── Step 2: chunk within each sentence ────────────────────────
	const chunks: CaptionChunk[] = [];
	for (const sentence of sentences) {
		for (let i = 0; i < sentence.length; i += MAX_WORDS_PER_CHUNK) {
			const slice = sentence.slice(i, i + MAX_WORDS_PER_CHUNK);
			chunks.push({
				words: slice,
				startMs: slice[0].startMs,
				endMs: slice[slice.length - 1].endMs,
			});
		}
	}

	return chunks;
}

// ── Caption display — ROOT level only, never inside a <Sequence> ──
// Placing this inside a <Sequence> would make useCurrentFrame() return
// a local (per-scene) frame, breaking sync with the voiceover.
function WordDisplay({ captions }: { captions: WordCaption[] }) {
	const { fps } = useVideoConfig();
	const frame = useCurrentFrame(); // global frame ✓
	const ms = (frame / fps) * 1000;

	const chunks = buildSentenceChunks(captions);

	const chunkIdx = chunks.findIndex(
		(c) => ms >= c.startMs && ms < c.endMs,
	);
	if (chunkIdx === -1) return null;

	const chunk = chunks[chunkIdx];

	// Fade + slight scale on chunk entrance (3 frames)
	const chunkStartFrame = Math.round((chunk.startMs / 1000) * fps);
	const framesIn = frame - chunkStartFrame;
	const opacity = interpolate(framesIn, [0, 3], [0, 1], {
		extrapolateRight: "clamp",
	});
	const chunkScale = interpolate(framesIn, [0, 3], [0.94, 1.0], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				display: "flex",
				alignItems: "center", // vertically centered ✓
				justifyContent: "center",
				pointerEvents: "none",
			}}
		>
			<div
				style={{
					opacity,
					transform: `scale(${chunkScale})`,
					transformOrigin: "center center",
					display: "flex",
					flexWrap: "wrap",
					gap: 12,
					justifyContent: "center",
					maxWidth: "88%",
				}}
			>
				{chunk.words.map((w, i) => (
					<span
						key={`${chunkIdx}-${i}`}
						style={{
							color: "#FFFFFF",
							fontSize: 72,
							fontWeight: 900,
							fontFamily:
								"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
							letterSpacing: "-0.02em",
							lineHeight: 1.15,
							textTransform: "uppercase",
							// Double shadow: close dark + wider dark for legibility on any bg
							textShadow:
								"0 2px 6px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.9)",
							display: "inline-block",
						}}
					>
						{w.word}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
}

// ── Single scene clip ──────────────────────────────────────────────
function SceneClip({
	scene,
	startFrame,
	durationFrames,
}: {
	scene: VideoScene;
	startFrame: number;
	durationFrames: number;
}) {
	const frame = useCurrentFrame();
	const relFrame = frame - startFrame;
	const progress = durationFrames > 0 ? relFrame / durationFrames : 0;
	const scale = 1 + progress * 0.04;

	return (
		<Sequence from={startFrame} durationInFrames={durationFrames}>
			<AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
				{/* Stock footage with ken burns zoom */}
				<AbsoluteFill
					style={{
						transform: `scale(${scale})`,
						transformOrigin: "center",
					}}
				>
					<OffthreadVideo
						src={scene.clip_url}
						style={{ width: "100%", height: "100%", objectFit: "cover" }}
						muted
						pauseWhenBuffering
					/>
				</AbsoluteFill>

				{/* Dark vignette so white text is readable without a box */}
				<AbsoluteFill
					style={{
						background:
							"radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,0,0,0.35) 0%, transparent 100%)",
					}}
				/>
			</AbsoluteFill>
		</Sequence>
	);
}

// ── Main composition ───────────────────────────────────────────────
export function ShortsComposition({
	scenes,
	audioUrl,
	captions,
	musicUrl,
	fps,
}: ShortsCompositionProps) {
	return (
		<AbsoluteFill style={{ background: "#000" }}>
			{musicUrl && <Audio src={musicUrl} volume={0.2} loop />}
			<Audio src={audioUrl} volume={1} />

			{scenes.map((scene) => (
				<SceneClip
					key={scene.index}
					scene={scene}
					startFrame={Math.round(scene.start_sec * fps)}
					durationFrames={Math.round(scene.alloc_sec * fps)}
				/>
			))}

			{/* Captions at root — global frame, always in sync with voiceover ✓ */}
			<WordDisplay captions={captions} />
		</AbsoluteFill>
	);
}
