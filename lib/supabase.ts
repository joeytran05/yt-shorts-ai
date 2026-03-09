import { createClient } from "@supabase/supabase-js";
import type {
	Idea,
	IdeaStatus,
	PipelineCount,
	ScrapeRun,
	ProductionJob,
	Settings,
} from "@/types";

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

// ── IDEAS ────────────────────────────────────────────────────────

export async function getIdeas(
	status?: IdeaStatus | IdeaStatus[],
	options: { limit?: number; offset?: number; orderBy?: string } = {},
): Promise<Idea[]> {
	const { limit = 100, offset = 0, orderBy = "viral_score" } = options;

	let q = supabase
		.from("ideas")
		.select("*")
		.order(orderBy, { ascending: false, nullsFirst: false })
		.range(offset, offset + limit - 1);

	if (Array.isArray(status)) q = q.in("status", status);
	else if (status) q = q.eq("status", status);

	const { data, error } = await q;
	if (error) throw error;
	return (data ?? []) as Idea[];
}

export async function getIdea(id: string): Promise<Idea | null> {
	const { data, error } = await supabase
		.from("ideas")
		.select("*")
		.eq("id", id)
		.single();
	if (error) return null;
	return data as Idea;
}

export async function upsertIdea(
	idea: Partial<Idea> & { content_hash: string },
): Promise<Idea> {
	const { data, error } = await db
		.from("ideas")
		.upsert(idea, { onConflict: "content_hash" })
		.select()
		.single();
	if (error) throw error;
	return data as Idea;
}

export async function updateIdea(
	id: string,
	patch: Partial<Idea>,
): Promise<Idea> {
	const { data, error } = await db
		.from("ideas")
		.update(patch)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return data as Idea;
}

export async function setStatus(
	id: string,
	status: IdeaStatus,
	extra?: Partial<Idea>,
): Promise<void> {
	const patch: Partial<Idea> = { status, ...extra };
	if (status === "approved") patch.approved_at = new Date().toISOString();
	if (status === "published") patch.published_at = new Date().toISOString();
	await db.from("ideas").update(patch).eq("id", id);
}

// ── PIPELINE COUNTS ──────────────────────────────────────────────

export async function getPipelineCounts(): Promise<PipelineCount[]> {
	const { data, error } = await supabase.from("pipeline_counts").select("*");
	if (error) throw error;
	return (data ?? []) as PipelineCount[];
}

// ── SCRAPE RUNS ──────────────────────────────────────────────────

export async function startScrapeRun(queries: string[]): Promise<ScrapeRun> {
	const { data, error } = await db
		.from("scrape_runs")
		.insert({ queries, status: "running" })
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

export async function getRecentRuns(limit = 5): Promise<ScrapeRun[]> {
	const { data } = await supabase
		.from("scrape_runs")
		.select("*")
		.order("started_at", { ascending: false })
		.limit(limit);
	return (data ?? []) as ScrapeRun[];
}

// ── PRODUCTION JOBS ──────────────────────────────────────────────

export async function createProductionJob(
	idea_id: string,
	job_type: ProductionJob["job_type"],
	provider: string,
	external_id?: string,
): Promise<ProductionJob> {
	const { data, error } = await db
		.from("production_jobs")
		.insert({ idea_id, job_type, provider, external_id, status: "running" })
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

export async function getSettings(): Promise<Settings> {
	const { data, error } = await supabase
		.from("settings")
		.select("*")
		.eq("id", "global")
		.single();

	if (error || !data) {
		// Return sensible defaults if settings row missing
		return {
			id: "global",
			youtube_queries: [],
			min_views: 100000,
			per_query: 15,
			target_niches: [],
			auto_approve_above: null,
			updated_at: new Date().toISOString(),
		};
	}
	return data as Settings;
}

export async function updateSettings(
	patch: Partial<Settings>,
): Promise<Settings> {
	const { data, error } = await db
		.from("settings")
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq("id", "global")
		.select()
		.single();

	if (error) throw new Error(`Settings update failed: ${error.message}`);
	return data as Settings;
}
