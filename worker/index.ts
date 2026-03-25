import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { runVideoPipeline } from "./video-pipeline";
import { checkScheduledUploads } from "./scheduler";
import type { VideoRenderJob, PgmqMessage } from "../types/scenes";

const QUEUE_NAME = "video_render_queue";
const POLL_INTERVAL_MS = 3_000;
const VISIBILITY_TIMEOUT_SEC = 360;
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 5; // read N jobs per tick, process highest priority first

/** How often to check for scheduled uploads (ms).
 *  Upload slots are spaced ≥1 hour apart, so 5-minute checks
 *  guarantee an upload fires within 5 min of its scheduled time. */
const SCHEDULE_CHECK_INTERVAL_MS = 5 * 60_000; // 5 minutes

function db() {
	return createClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

/** Read up to BATCH_SIZE jobs and return them sorted highest priority first. */
async function readNextBatch(): Promise<PgmqMessage<VideoRenderJob>[]> {
	const { data, error } = await db().rpc("pgmq_read", {
		queue_name: QUEUE_NAME,
		vt: VISIBILITY_TIMEOUT_SEC,
		qty: BATCH_SIZE,
	});
	if (error) {
		console.error("[worker] read error:", error.message);
		return [];
	}
	const msgs = (data as PgmqMessage<VideoRenderJob>[]) ?? [];
	return msgs.sort(
		(a, b) => (b.message.priority ?? 0) - (a.message.priority ?? 0),
	);
}

async function ack(msgId: bigint) {
	await db().rpc("pgmq_delete", { queue_name: QUEUE_NAME, msg_id: msgId });
}
async function archive(msgId: bigint) {
	await db().rpc("pgmq_archive", { queue_name: QUEUE_NAME, msg_id: msgId });
}

async function markFailed(ideaId: string, error: string) {
	await db()
		.from("ideas")
		.update({
			status: "failed",
			scenes_status: "failed",
			render_error: error,
		})
		.eq("id", ideaId);
}

async function poll() {
	console.log("[worker] Started —", new Date().toISOString());
	let idle = 0;
	let lastScheduleCheck = 0;

	while (true) {
		try {
			// ── Scheduled upload check (throttled to once per minute) ──
			const now = Date.now();
			if (now - lastScheduleCheck >= SCHEDULE_CHECK_INTERVAL_MS) {
				lastScheduleCheck = now;
				checkScheduledUploads().catch((err) =>
					console.error("[scheduler] Unexpected error:", err),
				);
			}

			// ── Video render queue ─────────────────────────────────────
			const batch = await readNextBatch();

			if (batch.length === 0) {
				idle++;
				if (idle % 20 === 0)
					console.log("[worker] Idle…", new Date().toISOString());
				await sleep(POLL_INTERVAL_MS);
				continue;
			}

			idle = 0;

			for (const msg of batch) {
				const { idea_id, user_id } = msg.message;

				if (msg.read_ct > MAX_ATTEMPTS) {
					console.warn(
						`[worker] Job ${msg.msg_id} exceeded max attempts`,
					);
					await archive(msg.msg_id);
					await markFailed(idea_id, "Exceeded max retry attempts");
					continue;
				}

				console.log(
					`\n[worker] Job ${msg.msg_id} | idea ${idea_id} | priority ${msg.message.priority ?? 0} | attempt ${msg.read_ct}`,
				);

				try {
					await runVideoPipeline(idea_id, user_id);
					await ack(msg.msg_id);
					console.log(`[worker] ✓ Job ${msg.msg_id} done`);
				} catch (err) {
					const error =
						err instanceof Error ? err.message : String(err);
					console.error(
						`[worker] ✗ Job ${msg.msg_id} failed:`,
						error,
					);

					if (msg.read_ct >= MAX_ATTEMPTS) {
						await archive(msg.msg_id);
						await markFailed(
							idea_id,
							`Failed after ${MAX_ATTEMPTS} attempts: ${error}`,
						);
					}
					// No ack = job reappears after visibility timeout for retry
				}
			}
		} catch (err) {
			console.error("[worker] Poll error:", err);
			await sleep(POLL_INTERVAL_MS * 2);
		}
	}
}

process.on("SIGTERM", () => {
	console.log("[worker] SIGTERM");
	process.exit(0);
});
process.on("SIGINT", () => {
	console.log("[worker] SIGINT");
	process.exit(0);
});

poll().catch((err) => {
	console.error("[worker] Fatal:", err);
	process.exit(1);
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
