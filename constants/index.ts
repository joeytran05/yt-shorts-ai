import { IdeaStatus } from "@/types";

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
