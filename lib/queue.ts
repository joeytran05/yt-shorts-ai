import { createClient } from "@supabase/supabase-js";
import type { VideoRenderJob, PgmqMessage } from "@/types/scenes";

const QUEUE_NAME = "video_render_queue";
const VISIBILITY_TIMEOUT_SEC = 300;
const MAX_ATTEMPTS = 3;

function makeAdminClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

export async function enqueueVideoRender(
	ideaId: string,
	userId: string,
	priority: "normal" | "high" = "normal",
): Promise<bigint> {
	const client = makeAdminClient();
	const message: VideoRenderJob = {
		idea_id: ideaId,
		user_id: userId,
		priority,
		enqueued_at: new Date().toISOString(),
	};

	const { data, error } = await client.rpc("pgmq_send", {
		queue_name: QUEUE_NAME,
		msg: message,
	});

	if (error) throw new Error(`Failed to enqueue job: ${error.message}`);
	return data as bigint;
}

export async function readNextJobs(
	batchSize = 1,
): Promise<PgmqMessage<VideoRenderJob>[]> {
	const client = makeAdminClient();
	const { data, error } = await client.rpc("pgmq_read", {
		queue_name: QUEUE_NAME,
		vt: VISIBILITY_TIMEOUT_SEC,
		qty: batchSize,
	});

	if (error) {
		console.error("[queue] read error:", error.message);
		return [];
	}

	return ((data as PgmqMessage<VideoRenderJob>[]) ?? []).filter(
		(msg) => msg.read_ct <= MAX_ATTEMPTS,
	);
}

export async function ackJob(msgId: bigint): Promise<void> {
	const client = makeAdminClient();
	const { error } = await client.rpc("pgmq_delete", {
		queue_name: QUEUE_NAME,
		msg_id: msgId,
	});
	if (error) console.error("[queue] ack error:", error.message);
}

export async function failJob(msgId: bigint): Promise<void> {
	const client = makeAdminClient();
	const { error } = await client.rpc("pgmq_archive", {
		queue_name: QUEUE_NAME,
		msg_id: msgId,
	});
	if (error) console.error("[queue] archive error:", error.message);
}
