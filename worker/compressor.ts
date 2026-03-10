import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import os from "os";
import fs from "fs/promises";

const exec = promisify(execFile);

export async function compressVideo(input: Buffer): Promise<Buffer> {
	const tmpIn = path.join(os.tmpdir(), `raw-${Date.now()}.mp4`);
	const tmpOut = path.join(os.tmpdir(), `compressed-${Date.now()}.mp4`);

	try {
		await fs.writeFile(tmpIn, input);

		await exec(ffmpegPath!, [
			"-i",
			tmpIn,
			"-c:v",
			"libx264",
			"-crf",
			"28",
			"-preset",
			"fast",
			"-vf",
			"scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-movflags",
			"+faststart",
			"-y",
			tmpOut,
		]);

		const compressed = await fs.readFile(tmpOut);
		console.log(
			`[compressor] ${(input.byteLength / 1_000_000).toFixed(1)}MB → ${(compressed.byteLength / 1_000_000).toFixed(1)}MB`,
		);
		return compressed;
	} finally {
		await fs.unlink(tmpIn).catch(() => {});
		await fs.unlink(tmpOut).catch(() => {});
	}
}
