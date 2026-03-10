import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import fsP from "fs/promises";
import type { VideoScene } from "../types/scenes";

export interface ClipServer {
	scenes: VideoScene[]; // clip_url replaced with http://127.0.0.1:PORT/clip-X.mp4
	shutdown: () => Promise<void>;
	cleanup: () => Promise<void>;
}

export async function startClipServer(
	scenes: VideoScene[],
): Promise<ClipServer> {
	// ── 1. Create temp dir ────────────────────────────────────────
	const tmpDir = await fsP.mkdtemp(path.join(os.tmpdir(), "clips-"));

	// ── 2. Find a free port first ─────────────────────────────────
	const port = await getFreePort();

	// ── 3. Download all clips into tmpDir ─────────────────────────
	console.log(`[clip-server] Downloading ${scenes.length} clips…`);
	const fileNames = await downloadAll(scenes, tmpDir);

	// ── 4. Start static HTTP server with range request support ────
	const server = http.createServer((req, res) => {
		const name = decodeURIComponent(req.url?.slice(1) ?? "");
		const filePath = path.join(tmpDir, name);

		if (!name || !fs.existsSync(filePath)) {
			res.writeHead(404);
			res.end();
			return;
		}

		const total = fs.statSync(filePath).size;
		const range = req.headers.range;

		if (range) {
			const [s, e] = range.replace("bytes=", "").split("-");
			const start = parseInt(s, 10);
			const end = e ? parseInt(e, 10) : total - 1;
			res.writeHead(206, {
				"Content-Range": `bytes ${start}-${end}/${total}`,
				"Accept-Ranges": "bytes",
				"Content-Length": String(end - start + 1),
				"Content-Type": "video/mp4",
			});
			fs.createReadStream(filePath, { start, end }).pipe(res);
		} else {
			res.writeHead(200, {
				"Content-Length": String(total),
				"Content-Type": "video/mp4",
				"Accept-Ranges": "bytes",
			});
			fs.createReadStream(filePath).pipe(res);
		}
	});

	await new Promise<void>((resolve) =>
		server.listen(port, "127.0.0.1", resolve),
	);
	console.log(`[clip-server] Listening on port ${port}`);

	// ── 5. Build scenes with local URLs ──────────────────────────
	const localScenes: VideoScene[] = scenes.map((s, i) => ({
		...s,
		clip_url: fileNames[i]
			? `http://127.0.0.1:${port}/${fileNames[i]}`
			: s.clip_url, // fallback to remote if download failed
	}));

	return {
		scenes: localScenes,
		shutdown: () => new Promise((resolve) => server.close(() => resolve())),
		cleanup: async () => {
			await fsP.rm(tmpDir, { recursive: true, force: true });
			console.log("[clip-server] Cleaned up");
		},
	};
}

// ── Download clips 3 at a time ────────────────────────────────────
async function downloadAll(
	scenes: VideoScene[],
	tmpDir: string,
): Promise<(string | null)[]> {
	const results: (string | null)[] = new Array(scenes.length).fill(null);

	for (let i = 0; i < scenes.length; i += 3) {
		const batch = scenes.slice(i, i + 3);
		const settled = await Promise.allSettled(
			batch.map((s, j) => downloadOne(s, i + j, tmpDir)),
		);
		settled.forEach((r, j) => {
			results[i + j] = r.status === "fulfilled" ? r.value : null;
			if (r.status === "rejected")
				console.error(`[clip-server] Clip ${i + j} failed:`, r.reason);
		});
	}

	return results;
}

async function downloadOne(
	scene: VideoScene,
	idx: number,
	tmpDir: string,
): Promise<string> {
	const fileName = `clip-${idx}.mp4`;
	const filePath = path.join(tmpDir, fileName);

	const res = await fetch(scene.clip_url);
	if (!res.ok)
		throw new Error(`HTTP ${res.status} for "${scene.visual_query}"`);

	const buf = Buffer.from(await res.arrayBuffer());
	await fsP.writeFile(filePath, buf);

	const mb = (buf.byteLength / 1_000_000).toFixed(1);
	console.log(`[clip-server] [${idx}] ${scene.visual_query} (${mb}MB)`);

	return fileName;
}

// ── Get a free OS-assigned port ───────────────────────────────────
function getFreePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const s = http.createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port } = s.address() as { port: number };
			s.close(() => resolve(port));
		});
		s.on("error", reject);
	});
}
