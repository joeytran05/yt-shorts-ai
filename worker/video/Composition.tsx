import React from "react";
import {
	AbsoluteFill,
	OffthreadVideo,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import type {
	ShortsCompositionProps,
	VideoScene,
	CaptionEntry,
} from "../../types/scenes";
import { Audio } from "@remotion/media";

// ── Active caption at current frame ──────────────────────────────
function useActiveCaption(captions: CaptionEntry[], fps: number): string {
	const frame = useCurrentFrame();
	const ms = (frame / fps) * 1000;
	const active = captions.find((c) => ms >= c.startMs && ms < c.endMs);
	return active?.text ?? "";
}

// ── Single scene clip ─────────────────────────────────────────────
function SceneClip({
	scene,
	startFrame,
	durationFrames,
	captions,
}: {
	scene: VideoScene;
	startFrame: number;
	durationFrames: number;
	captions: CaptionEntry[];
}) {
	const { fps } = useVideoConfig();
	const frame = useCurrentFrame();
	const relFrame = frame - startFrame;
	const progress = durationFrames > 0 ? relFrame / durationFrames : 0;

	const scale = 1 + progress * 0.04;
	const opacity =
		relFrame < 6
			? relFrame / 6
			: relFrame > durationFrames - 6
				? (durationFrames - relFrame) / 6
				: 1;

	const captionText = useActiveCaption(captions, fps);

	return (
		<Sequence from={startFrame} durationInFrames={durationFrames}>
			<AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
				{/* Stock footage with ken burns */}
				<AbsoluteFill
					style={{
						transform: `scale(${scale})`,
						transformOrigin: "center",
					}}
				>
					<OffthreadVideo
						src={scene.clip_url}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
						muted
						pauseWhenBuffering
					/>
				</AbsoluteFill>

				{/* Bottom gradient */}
				<AbsoluteFill
					style={{
						background:
							"linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 35%, transparent 60%)",
					}}
				/>

				{/* Remotion captions — word-synced, bottom third */}
				{captionText ? (
					<AbsoluteFill
						style={{
							display: "flex",
							alignItems: "flex-end",
							justifyContent: "center",
							paddingBottom: 140,
							paddingLeft: 32,
							paddingRight: 32,
							opacity,
						}}
					>
						<p
							style={{
								color: "#ffffff",
								fontSize: 52,
								fontWeight: 900,
								fontFamily:
									"system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
								textAlign: "center",
								lineHeight: 1.2,
								margin: 0,
								letterSpacing: "-0.01em",
								textShadow:
									"0 2px 20px rgba(0,0,0,1), 0 1px 6px rgba(0,0,0,0.8)",
								// Highlight current word with yellow
								whiteSpace: "pre-wrap",
							}}
						>
							{captionText}
						</p>
					</AbsoluteFill>
				) : null}
			</AbsoluteFill>
		</Sequence>
	);
}

// ── Main composition ──────────────────────────────────────────────
export function ShortsComposition({
	scenes,
	audioUrl,
	captions,
	fps,
}: ShortsCompositionProps) {
	return (
		<AbsoluteFill style={{ background: "#000" }}>
			<Audio src={audioUrl} />
			{scenes.map((scene) => (
				<SceneClip
					key={scene.index}
					scene={scene}
					startFrame={Math.round(scene.start_sec * fps)}
					durationFrames={Math.round(scene.alloc_sec * fps)}
					captions={captions}
				/>
			))}
		</AbsoluteFill>
	);
}
