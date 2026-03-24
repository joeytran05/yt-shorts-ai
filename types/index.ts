import { SceneData } from "./scenes";

// ── SaaS / billing types ─────────────────────────────────────────

export type PlanType = "free" | "creator" | "pro";

export interface User {
	id: string; // Clerk userId (user_2abc...)
	email: string | null;
	videos_rendered_this_period: number;
	period_reset_at: string;
	created_at: string;
	updated_at: string;
}

// ────────────────────────────────────────────────────────────────

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
	user_id: string;
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
	music_url: string | null;
	voice_id: string | null;
	final_video_url: string | null;
	thumbnail_custom_url: string | null;

	// Publish
	yt_video_id: string | null;
	yt_url: string | null;
	scheduled_at: string | null;
	published_at: string | null;

	// Performance metrics (fetched from YouTube API post-publish)
	yt_views: number | null;
	yt_likes: number | null;
	yt_comments: number | null;
	yt_metrics_fetched_at: string | null;

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

export interface YoutubeQuery {
	query: string;
	enabled: boolean;
	custom: boolean;
}

export interface Settings {
	user_id: string; // was: id: string (the id='global' single-row pattern is removed)
	youtube_queries: YoutubeQuery[];
	min_views: number;
	per_query: number;
	target_niches: string[];
	auto_approve_above: number | null;
	updated_at: string;
}

export interface Channel {
	id: string;
	user_id: string; // one channel per user
	name: string;
	// niche removed — channels are no longer niche-scoped
	yt_channel_id: string | null;
	yt_channel_name: string | null;
	yt_channel_thumbnail: string | null;
	created_at: string;
}

// ── Step definitions ──────────────────────────────────────────────
export type StepId =
	| "welcome"
	| "discover"
	| "idea-found"
	| "script"
	| "review"
	| "complete";

export interface StepDef {
	id: StepId;
	/** CSS selector for the spotlight target. null = centered modal. */
	target: string | null;
	/** When true, clicks pass through the backdrop so the user can interact with the page. */
	interactive: boolean;
	badge: string;
	title: string;
	body: string;
	/** null = no overlay CTA (user clicks the real UI instead). */
	ctaLabel: string | null;
}
