import { SceneData } from "./scenes";

export type IdeaStatus =
	| "discovered"
	| "scored"
	| "rejected"
	| "approved"
	| "scripted"
	| "generating_voice"
	| "generating_video"
	| "adding_captions"
	| "produced"
	| "changes_requested"
	| "ready_to_publish"
	| "scheduled"
	| "uploading"
	| "published"
	| "failed";

export type IdeaSource = "youtube" | "tiktok" | "reddit" | "manual";

export type NicheType =
	| "life_hacks"
	| "funny_fails"
	| "motivation"
	| "tech_tips"
	| "diy"
	| "asmr"
	| "fitness"
	| "finance"
	| "food"
	| "travel"
	| "gaming"
	| "beauty"
	| "pets"
	| "education"
	| "news"
	| "other";

export type YTSearchResponse = {
	id: {
		kind: string;
		videoId: string;
		channelId: string;
		playlistId: string;
	};
};

export type YTVideoResponse = {
	id: string;
	snippet: {
		title: string;
		description: string;
		channelTitle: string;
		tags: string[];
		thumbnails: {
			high?: {
				url: string;
			};
		};
	};
	statistics: {
		viewCount: string;
		likeCount?: string;
		commentCount?: string;
	};
};

export interface Idea {
	id: string;
	source: IdeaSource;
	source_url: string | null;
	source_video_id: string | null;
	source_channel: string | null;
	source_views: number;
	source_likes: number;
	source_comments: number;
	thumbnail_url: string | null;
	title: string;
	description: string | null;
	tags: string[];
	niche: NicheType;
	content_hash: string | null;

	// Scores
	viral_score: number | null;
	hook_score: number | null;
	trend_score: number | null;
	competition_score: number | null;
	ai_reasoning: string | null;

	// Script
	script_hook: string | null;
	script_body: string | null;
	script_cta: string | null;
	script_full: string | null;
	script_duration_sec: number | null;

	// SEO
	seo_title: string | null;
	seo_description: string | null;
	seo_tags: string[];
	seo_hashtags: string[];

	// Production
	audio_url: string | null;
	video_raw_url: string | null;
	video_captioned_url: string | null;
	music_track: string | null;
	voice_id: string | null;
	final_video_url: string | null;
	thumbnail_custom_url: string | null;

	// Publish
	yt_video_id: string | null;
	yt_url: string | null;
	scheduled_at: string | null;
	published_at: string | null;

	review_notes: string | null;
	rejection_reason: string | null;
	status: IdeaStatus;
	created_at: string;
	updated_at: string;
	approved_at: string | null;
	last_error: string | null;
	retry_count: number;

	// Video pipeline
	scene_data: SceneData | null;
	scenes_status:
		| "none"
		| "planning"
		| "clips_fetching"
		| "clips_ready"
		| "rendering"
		| "done"
		| "failed";
	render_job_id: number | null;
	audio_duration_sec: number | null;
	render_error: string | null;
	render_started_at: string | null;
	render_finished_at: string | null;
}

export interface ScrapeRun {
	id: string;
	source: IdeaSource;
	queries: string[];
	ideas_found: number;
	ideas_new: number;
	status: "running" | "completed" | "failed";
	error_msg: string | null;
	duration_ms: number | null;
	started_at: string;
	completed_at: string | null;
}

export interface ProductionJob {
	id: string;
	idea_id: string;
	job_type: "voiceover" | "video" | "captions" | "thumbnail";
	provider: string | null;
	external_id: string | null;
	status: "pending" | "running" | "done" | "failed";
	result_url: string | null;
	error_msg: string | null;
	started_at: string;
	completed_at: string | null;
}

export interface PipelineCount {
	status: IdeaStatus;
	total: number;
	avg_score: number | null;
}

// ── AI response shapes ──────────────────────────────────────────

export interface ScoreResult {
	viral_score: number;
	hook_score: number;
	trend_score: number;
	competition_score: number;
	// ai_reasoning?: string | null;
}

export interface ScriptResult {
	script_hook: string;
	script_body: string;
	script_cta: string;
	script_full: string;
	script_duration_sec: number;

	seo_title: string;
	seo_description: string;
	seo_tags: string[];

	niche: NicheType;
	music_suggestion: string;
}

// ── Action return types ─────────────────────────────────────────

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

export interface DiscoverResult {
	run_id: string;
	found: number;
	new_ideas: number;
	skipped: number;
	ideas: Idea[];
	duration_ms: number;
}

export const PIPELINE_STAGES: {
	status: IdeaStatus;
	label: string;
	step: number;
}[] = [
	{ status: "scored", label: "Review Queue", step: 1 },
	{ status: "approved", label: "Scripting", step: 2 },
	{ status: "scripted", label: "Ready to Produce", step: 2 },
	{ status: "generating_voice", label: "Generating Voice", step: 3 },
	{ status: "generating_video", label: "Rendering Video", step: 3 },
	{ status: "adding_captions", label: "Adding Captions", step: 4 },
	{ status: "produced", label: "Final Review", step: 5 },
	{ status: "ready_to_publish", label: "Ready to Upload", step: 5 },
	{ status: "scheduled", label: "Scheduled", step: 6 },
	{ status: "published", label: "Published", step: 6 },
];

export const STATUS_BADGE: Record<string, { color: string; label: string }> = {
	discovered: { color: "var(--muted)", label: "Discovered" },
	scored: { color: "var(--score)", label: "Scored" },
	rejected: { color: "#334155", label: "Rejected" },
	approved: { color: "var(--script)", label: "Approved" },
	scripted: { color: "var(--script)", label: "Scripted" },
	generating_voice: { color: "var(--prod)", label: "⏳ Voice…" },
	generating_video: { color: "var(--prod)", label: "⏳ Video…" },
	adding_captions: { color: "var(--prod)", label: "⏳ Captions…" },
	produced: { color: "var(--review)", label: "Produced" },
	changes_requested: { color: "var(--danger)", label: "Changes Req." },
	ready_to_publish: { color: "var(--publish)", label: "Ready" },
	scheduled: { color: "var(--publish)", label: "📅 Scheduled" },
	uploading: { color: "var(--publish)", label: "⬆ Uploading…" },
	published: { color: "var(--publish)", label: "✓ Live" },
	failed: { color: "var(--danger)", label: "✗ Failed" },
};

export const NICHE_EMOJI: Record<NicheType, string> = {
	life_hacks: "⚡",
	funny_fails: "😂",
	motivation: "🔥",
	tech_tips: "💻",
	diy: "🔧",
	asmr: "🎧",
	fitness: "💪",
	finance: "💰",
	food: "🍜",
	travel: "✈️",
	gaming: "🎮",
	beauty: "✨",
	pets: "🐾",
	education: "📚",
	news: "📰",
	other: "📌",
};

export const ELEVENLABS_VOICES = [
	{ id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (US Female)" },
	{ id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (US Male)" },
	{ id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte (UK Female)" },
	{ id: "nPczCjzI2devNBz1zQrb", name: "Brian (US Male)" },
	{ id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (UK Female)" },
];

export const OPTIMAL_UPLOAD_TIMES = [
	{ label: "12 PM UTC (7AM EST)", utc_hour: 12 },
	{ label: "2 PM UTC (9AM EST)", utc_hour: 14 },
	{ label: "6 PM UTC (1PM EST)", utc_hour: 18 },
	{ label: "8 PM UTC (3PM EST)", utc_hour: 20 },
];
