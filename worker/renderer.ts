import path from "path";
import os from "os";
import fs from "fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type {
	ShortsCompositionProps,
	VideoScene,
	CaptionEntry,
} from "../types/scenes";

const FPS = 30;
let cachedBundleUrl: string | null = null;

async function getBundle(): Promise<string> {
	if (cachedBundleUrl) return cachedBundleUrl;
	console.log("[renderer] Bundling…");
	cachedBundleUrl = await bundle({
		entryPoint: path.resolve(__dirname, "video/index.tsx"), // ← updated path
		webpackOverride: (config) => config,
	});
	console.log("[renderer] Bundle ready");
	return cachedBundleUrl;
}

export async function renderShortsVideo(input: {
	scenes: VideoScene[];
	audioUrl: string;
	captions: CaptionEntry[]; // ← added
	totalDurationSec: number;
}): Promise<Buffer> {
	const { scenes, audioUrl, captions, totalDurationSec } = input;
	const totalFrames = Math.round(totalDurationSec * FPS);
	const bundleUrl = await getBundle();

	const props: ShortsCompositionProps = {
		scenes,
		audioUrl,
		captions,
		totalDurationSec,
		fps: FPS,
	};

	const composition = await selectComposition({
		serveUrl: bundleUrl,
		id: "ShortsVideo",
		inputProps: props as Record<string, unknown>,
	});

	const tmpFile = path.join(os.tmpdir(), `shorts-${Date.now()}.mp4`);

	await renderMedia({
		composition: { ...composition, durationInFrames: totalFrames },
		serveUrl: bundleUrl,
		codec: "h264",
		outputLocation: tmpFile,
		inputProps: props,
		imageFormat: "jpeg",
		jpegQuality: 88,
		concurrency: 2,
		timeoutInMilliseconds: 180_000,
		// Cap how much decoded video Remotion keeps in memory at once
		// Default is unlimited — 256MB prevents 4K frames from piling up
		offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024,
		chromiumOptions: {
			disableWebSecurity: true,
		},
		onProgress: ({ progress }) => {
			process.stdout.write(`\r[renderer] ${Math.round(progress * 100)}%`);
		},
	});

	console.log("");
	const buffer = await fs.readFile(tmpFile);
	await fs.unlink(tmpFile).catch(() => {});
	return buffer;
}
