import { IdeaStatus, NicheType, StepDef } from "@/types";

export const STAGE_GROUPS = [
	{
		id: "discover",
		label: "01 Discover",
		color: "var(--score)",
		statuses: ["scored", "discovered"] as IdeaStatus[],
	},
	{
		id: "script",
		label: "02 Script",
		color: "var(--script)",
		statuses: ["approved", "scripted"] as IdeaStatus[],
	},
	{
		id: "produce",
		label: "03 Produce",
		color: "var(--prod)",
		statuses: [
			"generating_voice",
			"generating_video",
			"adding_captions",
			"produced",
		] as IdeaStatus[],
	},
	{
		id: "review",
		label: "04 Review",
		color: "var(--review)",
		statuses: ["changes_requested", "ready_to_publish"] as IdeaStatus[],
	},
	{
		id: "publish",
		label: "05 Publish",
		color: "var(--publish)",
		statuses: ["scheduled", "uploading", "published"] as IdeaStatus[],
	},
	{
		id: "archive",
		label: "🗂 Archive",
		color: "var(--muted)",
		statuses: ["rejected", "failed"] as IdeaStatus[],
	},
] as const;

// Onboarding tutorial steps

export const STEPS: StepDef[] = [
	{
		id: "welcome",
		target: null,
		interactive: false,
		badge: "Welcome",
		title: "Welcome to Shorts.AI! 👋",
		// body: "Let's take a 2-minute tour of your automated YouTube Shorts pipeline. We'll use sample data — zero API credits used.",
		body: "Let's take a 2-minute tour of your automated YouTube Shorts pipeline.",
		ctaLabel: "Start Tour →",
	},
	{
		id: "discover",
		target: '[data-tutorial="discover-btn"]',
		interactive: false,
		badge: "Step 1 of 4 · Discover",
		title: "🔍 Find Trending Ideas",
		body: "The discovery engine scrapes YouTube for trending content and scores each idea with AI. Or you can manually add ideas. Click 'Show me' to discover an idea instantly.",
		ctaLabel: "Show me ▶",
	},
	{
		id: "idea-found",
		target: '[data-tutorial="tutorial-idea"]',
		interactive: true,
		badge: "Step 2 of 4 · Approve",
		title: "💡 Idea Discovered & Scored",
		body: "This idea scored 87/100 — AI analyzed viral potential, hook strength, and competition. Click '✓ Approve → Script' at the bottom of the card.",
		ctaLabel: null,
	},
	{
		id: "script",
		target: '[data-tutorial="tutorial-idea"]',
		interactive: true,
		badge: "Step 3 of 4 · Produce",
		title: "✍️ Script Auto-Generated",
		body: "AI wrote a full script: hook, body, and CTA — optimized for 58 seconds. Click '🎤 Generate Voice' to fast-forward through production.",
		ctaLabel: null,
	},
	{
		id: "review",
		target: '[data-tutorial="tutorial-idea"]',
		interactive: false,
		badge: "Step 4 of 4 · Publish",
		title: "🎬 Video Ready to Publish",
		body: "Your video is produced! From here you'd schedule a time or upload directly to YouTube. Let's wrap up the tour.",
		ctaLabel: "Finish Tour ✓",
	},
	{
		id: "complete",
		target: null,
		interactive: false,
		badge: "Complete 🎉",
		title: "You're all set!",
		body: "You know the full pipeline: Discover → Script → Produce → Review → Publish. The sample idea has been removed. Ready to create your first real Short?",
		ctaLabel: "Start Creating!",
	},
];

// ── Mock idea — no real API calls needed ─────────────────────────

export const TUTORIAL_IDEA = {
	title: "5 Productivity Hacks That Changed My Life",
	description:
		"Top productivity tips used by high performers — this format hit 2.1M views",
	source: "youtube",
	source_url: "https://youtube.com/shorts/tutorial-sample",
	source_channel: "ProductivityPro",
	source_views: 2100000,
	source_likes: 87400,
	source_comments: 3200,
	thumbnail_url: "https://picsum.photos/seed/productivity/320/180",
	tags: ["productivity", "lifehacks", "routine", "__tutorial__"],
	niche: "life_hacks",
	// Pre-scored
	viral_score: 87,
	hook_score: 91,
	trend_score: 83,
	competition_score: 78,
	ai_reasoning:
		"High viral potential: strong actionable hook, trending productivity niche, proven engagement format. Above-average engagement rate at 4.1%.",
	// Pre-written script
	script_hook:
		"Most people waste 3 hours every single day without realizing it.",
	script_body:
		"Hack #1: The 2-Minute Rule — if it takes less than 2 minutes, do it now. Hack #2: Time blocking — protect your deep work hours like meetings. Hack #3: The 90-minute sprint — your brain can only truly focus for 90 minutes max. Hack #4: Single-tab rule — close everything except what you're working on. Hack #5: Night planning — spend 5 minutes every evening planning tomorrow.",
	script_cta:
		"Follow for a new productivity tip every day! Which hack are you trying first?",
	script_full:
		"Most people waste 3 hours every single day without realizing it.\n\nHack #1: The 2-Minute Rule — if it takes less than 2 minutes, do it now.\nHack #2: Time blocking — protect your deep work hours like meetings.\nHack #3: The 90-minute sprint — your brain can only truly focus for 90 minutes max.\nHack #4: Single-tab rule — close everything except what you're working on.\nHack #5: Night planning — spend 5 minutes every evening planning tomorrow.\n\nFollow for a new productivity tip every day! Which hack are you trying first?",
	script_duration_sec: 58,
	seo_title: "5 Productivity Hacks That Changed My Life #shorts",
	seo_description:
		"Transform your daily routine with these 5 science-backed productivity hacks. Stop wasting time and start achieving more. #productivity #lifehacks #shorts",
	seo_tags: [
		"productivity",
		"lifehacks",
		"timemanagement",
		"routine",
		"focus",
		"shorts",
	],
	seo_hashtags: ["#productivity", "#lifehacks", "#shorts", "#routine"],
	// Special marker — used to identify/cleanup tutorial ideas
	content_hash: "__tutorial__",
	status: "scored" as IdeaStatus,
};

// Optimal YouTube Shorts upload windows based on US/global engagement data.
// Labels show EST (UTC-5) + UTC. Peak slots marked with ⭐.
export const OPTIMAL_UPLOAD_TIMES = [
	{ label: "7 AM EST · 12 UTC — Morning commute", utc_hour: 12 },
	{ label: "9 AM EST · 14 UTC — Late morning", utc_hour: 14 },
	{ label: "11 AM EST · 16 UTC — Pre-lunch", utc_hour: 16 },
	{ label: "12 PM EST · 17 UTC ⭐ Lunch peak", utc_hour: 17 },
	{ label: "2 PM EST · 19 UTC — Afternoon", utc_hour: 19 },
	{ label: "3 PM EST · 20 UTC ⭐ After school", utc_hour: 20 },
	{ label: "5 PM EST · 22 UTC ⭐ After work", utc_hour: 22 },
	{ label: "7 PM EST · 0 UTC  ⭐ Prime time", utc_hour: 0 },
	{ label: "9 PM EST · 2 UTC  ⭐ Peak evening", utc_hour: 2 },
	{ label: "11 PM EST · 4 UTC — Late night", utc_hour: 4 },
];

export const ELEVENLABS_VOICES = [
	{ id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (US Female)" },
	{ id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (US Male)" },
	{ id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte (UK Female)" },
	{ id: "nPczCjzI2devNBz1zQrb", name: "Brian (US Male)" },
	{ id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (UK Female)" },
];

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
