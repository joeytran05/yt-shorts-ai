export interface ScenePlan {
	index: number;
	text: string;
	visual_query: string;
}

export interface VideoScene extends ScenePlan {
	clip_id: string;
	clip_url: string;
	clip_width: number;
	clip_height: number;
	clip_duration_sec: number;
	alloc_sec: number;
	start_sec: number;
}

export interface SceneData {
	planned_at: string;
	clips_fetched_at?: string;
	scenes: VideoScene[];
}

// Caption entry from Whisper SRT (parsed)
export interface CaptionEntry {
	startMs: number;
	endMs: number;
	text: string;
}

export interface VideoRenderJob {
	idea_id: string;
	priority: "normal" | "high";
	enqueued_at: string;
}

export interface PgmqMessage<T = unknown> {
	msg_id: bigint;
	read_ct: number;
	enqueued_at: string;
	vt: string;
	message: T;
}

export interface ShortsCompositionProps {
	scenes: VideoScene[];
	audioUrl: string;
	captions: CaptionEntry[]; // ← parsed from Whisper SRT
	musicUrl: string | null;
	fps: number;
	[key: string]: unknown; // ← makes it compatible with Record<string, unknown>
}

export interface PexelsClip {
	id: string;
	url: string;
	width: number;
	height: number;
	duration: number;
}
