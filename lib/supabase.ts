import { createClient } from "@supabase/supabase-js";
import type {
	Idea,
	IdeaStatus,
	PipelineCount,
	ScrapeRun,
	ProductionJob,
	Settings,
	User,
} from "@/types";
import { Mood } from "@/components/MusicLibrary";

// ── Clients ──────────────────────────────────────────────────────

export const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Service role bypasses RLS — only use in server actions / API routes
export const db = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } },
);

// ── USERS ────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<User | null> {
	const { data, error } = await db
		.from("users")
		.select("*")
		.eq("id", userId)
		.single();
	if (error) return null;
	return data as User;
}

export async function upsertUser(
	user: Partial<User> & { id: string },
): Promise<User> {
	const { data, error } = await db
		.from("users")
		.upsert(
			{ ...user, updated_at: new Date().toISOString() },
			{ onConflict: "id" },
		)
		.select()
		.single();
	if (error) throw error;
	return data as User;
}

export async function updateUser(
	userId: string,
	patch: Partial<User>,
): Promise<User> {
	const { data, error } = await db
		.from("users")
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq("id", userId)
		.select()
		.single();
	if (error) throw error;
	return data as User;
}

// ── IDEAS ────────────────────────────────────────────────────────

export async function getIdeas(
	userId: string,
	status?: IdeaStatus | IdeaStatus[],
	options: { limit?: number; offset?: number; orderBy?: string } = {},
): Promise<Idea[]> {
	const { limit = 100, offset = 0, orderBy = "viral_score" } = options;

	let q = db
		.from("ideas")
		.select("*")
		.eq("user_id", userId)
		.order(orderBy, { ascending: false, nullsFirst: false })
		.range(offset, offset + limit - 1);

	if (Array.isArray(status)) q = q.in("status", status);
	else if (status) q = q.eq("status", status);

	const { data, error } = await q;
	if (error) throw error;
	return (data ?? []) as Idea[];
}

export async function getIdea(
	userId: string,
	id: string,
): Promise<Idea | null> {
	const { data, error } = await db
		.from("ideas")
		.select("*")
		.eq("id", id)
		.eq("user_id", userId)
		.single();
	if (error) return null;
	return data as Idea;
}

export async function upsertIdea(
	userId: string,
	idea: Partial<Idea> & { content_hash: string },
): Promise<Idea> {
	const { data, error } = await db
		.from("ideas")
		.upsert(
			{ ...idea, user_id: userId },
			{ onConflict: "content_hash,user_id" },
		)
		.select()
		.single();
	if (error) throw error;
	return data as Idea;
}

export async function updateIdea(
	userId: string,
	id: string,
	patch: Partial<Idea>,
): Promise<Idea> {
	const { data, error } = await db
		.from("ideas")
		.update(patch)
		.eq("id", id)
		.eq("user_id", userId)
		.select()
		.single();
	if (error) throw error;
	return data as Idea;
}

export async function setStatus(
	userId: string,
	id: string,
	status: IdeaStatus,
	extra?: Partial<Idea>,
): Promise<void> {
	const patch: Partial<Idea> = { status, ...extra };
	if (status === "approved") patch.approved_at = new Date().toISOString();
	if (status === "published") patch.published_at = new Date().toISOString();
	await db.from("ideas").update(patch).eq("id", id).eq("user_id", userId);
}

// ── PIPELINE COUNTS ──────────────────────────────────────────────
// Replaces the old pipeline_counts materialized view (dropped in migration).
// Returns the same PipelineCount[] shape — no component changes needed.

export async function getPipelineCounts(
	userId: string,
): Promise<PipelineCount[]> {
	const { data, error } = await db
		.from("ideas")
		.select("status, viral_score")
		.eq("user_id", userId);

	if (error) throw error;
	if (!data || data.length === 0) return [];

	// Group by status in JavaScript (avoids raw SQL)
	const grouped = new Map<
		string,
		{ total: number; scoreSum: number; scoreCount: number }
	>();

	for (const row of data) {
		const existing = grouped.get(row.status) ?? {
			total: 0,
			scoreSum: 0,
			scoreCount: 0,
		};
		existing.total += 1;
		if (row.viral_score != null) {
			existing.scoreSum += row.viral_score;
			existing.scoreCount += 1;
		}
		grouped.set(row.status, existing);
	}

	return Array.from(grouped.entries()).map(([status, g]) => ({
		status: status as IdeaStatus,
		total: g.total,
		avg_score: g.scoreCount > 0 ? g.scoreSum / g.scoreCount : null,
	}));
}

// ── SCRAPE RUNS ──────────────────────────────────────────────────

export async function startScrapeRun(
	userId: string,
	queries: string[],
): Promise<ScrapeRun> {
	const { data, error } = await db
		.from("scrape_runs")
		.insert({ user_id: userId, queries, status: "running" })
		.select()
		.single();
	if (error) throw error;
	return data as ScrapeRun;
}

export async function endScrapeRun(
	id: string,
	result: {
		ideas_found: number;
		ideas_new: number;
		duration_ms: number;
		status?: "completed" | "failed";
		error_msg?: string;
	},
): Promise<void> {
	await db
		.from("scrape_runs")
		.update({
			status: result.status ?? "completed",
			ideas_found: result.ideas_found,
			ideas_new: result.ideas_new,
			duration_ms: result.duration_ms,
			error_msg: result.error_msg ?? null,
			completed_at: new Date().toISOString(),
		})
		.eq("id", id);
}

export async function getRecentRuns(
	userId: string,
	limit = 5,
): Promise<ScrapeRun[]> {
	const { data } = await db
		.from("scrape_runs")
		.select("*")
		.eq("user_id", userId)
		.order("started_at", { ascending: false })
		.limit(limit);
	return (data ?? []) as ScrapeRun[];
}

/**
 * Returns the ISO timestamp when the user's 12-hour discovery cooldown expires,
 * or null if they are free to run discovery now.
 */
export async function getDiscoveryCooldown(
	userId: string,
): Promise<string | null> {
	const { data } = await db
		.from("scrape_runs")
		.select("completed_at")
		.eq("user_id", userId)
		.eq("status", "completed")
		.order("completed_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!data?.completed_at) return null;

	const nextAllowed = new Date(
		new Date(data.completed_at).getTime() + 12 * 60 * 60 * 1000,
	);
	return nextAllowed > new Date() ? nextAllowed.toISOString() : null;
}

// ── PRODUCTION JOBS ──────────────────────────────────────────────

export async function createProductionJob(
	userId: string,
	idea_id: string,
	job_type: ProductionJob["job_type"],
	provider: string,
	external_id?: string,
): Promise<ProductionJob> {
	const { data, error } = await db
		.from("production_jobs")
		.insert({
			user_id: userId,
			idea_id,
			job_type,
			provider,
			external_id,
			status: "running",
		})
		.select()
		.single();
	if (error) throw error;
	return data as ProductionJob;
}

export async function completeProductionJob(
	id: string,
	result_url: string,
): Promise<void> {
	await db
		.from("production_jobs")
		.update({
			status: "done",
			result_url,
			completed_at: new Date().toISOString(),
		})
		.eq("id", id);
}

export async function failProductionJob(
	id: string,
	error_msg: string,
): Promise<void> {
	await db
		.from("production_jobs")
		.update({
			status: "failed",
			error_msg,
			completed_at: new Date().toISOString(),
		})
		.eq("id", id);
}

// ── SETTINGS ─────────────────────────────────────────────────────

export async function getSettings(userId: string): Promise<Settings> {
	const { data, error } = await db
		.from("settings")
		.select("*")
		.eq("user_id", userId)
		.single();

	if (error || !data) {
		// Return sensible defaults if settings row missing (shouldn't happen
		// after onboarding, but serves as a safe fallback)
		return {
			user_id: userId,
			youtube_queries: [],
			min_views: 100000,
			per_query: 1,
			target_niches: [],
			auto_approve_above: null,
			updated_at: new Date().toISOString(),
		};
	}
	return data as Settings;
}

export async function updateSettings(
	userId: string,
	patch: Partial<Settings>,
): Promise<Settings> {
	const { data, error } = await db
		.from("settings")
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw new Error(`Settings update failed: ${error.message}`);
	return data as Settings;
}

// ── MUSIC TRACKS ─────────────────────────────────────────────────

export interface Track {
	id: string;
	name: string;
	mood: Mood;
	url: string;
	duration: number;
	user_id: string | null; // null = system track visible to all
}

export async function getMusicTracksForUser(userId: string): Promise<Track[]> {
	const { data, error } = await db
		.from("music_tracks")
		.select("*")
		.or(`user_id.eq.${userId},user_id.is.null`)
		.order("mood", { ascending: true })
		.order("name", { ascending: true });

	if (error) throw error;
	return (data ?? []) as Track[];
}
