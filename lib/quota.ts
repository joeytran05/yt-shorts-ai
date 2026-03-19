/**
 * lib/quota.ts
 *
 * Worker-safe quota utilities — NO Next.js or @/ imports.
 * Supabase URL + service role key are passed as parameters so this module
 * works identically in the Next.js app (server actions) and the worker process.
 */

import { createClient } from "@supabase/supabase-js";

export type PlanType = "free" | "starter" | "creator" | "pro";

export interface PlanLimit {
	rendersPerMonth: number; // -1 = unlimited
	channels: number;
	customQueries: boolean;
	musicUpload: boolean;
	scheduling: boolean;
	abTesting: boolean;
	queuePriority: 0 | 1 | 2 | 3;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimit> = {
	free: {
		rendersPerMonth: 3,
		channels: 1,
		customQueries: false,
		musicUpload: false,
		scheduling: false,
		abTesting: false,
		queuePriority: 0,
	},
	starter: {
		rendersPerMonth: 20,
		channels: 1,
		customQueries: true,
		musicUpload: true,
		scheduling: true,
		abTesting: false,
		queuePriority: 1,
	},
	creator: {
		rendersPerMonth: 60,
		channels: 3,
		customQueries: true,
		musicUpload: true,
		scheduling: true,
		abTesting: true,
		queuePriority: 2,
	},
	pro: {
		rendersPerMonth: 200,
		channels: 10,
		customQueries: true,
		musicUpload: true,
		scheduling: true,
		abTesting: true,
		queuePriority: 3,
	},
};

function createDb(supabaseUrl: string, serviceRoleKey: string) {
	return createClient(supabaseUrl, serviceRoleKey, {
		auth: { persistSession: false },
	});
}

/**
 * Check whether the user is allowed to render another video.
 * - Automatically resets `videos_rendered_this_period` if the billing period
 *   has rolled over.
 * - Returns null if the render is allowed, or an error string if the limit
 *   is exceeded.
 *
 * The `plan` must be resolved by the caller (e.g. via Clerk `auth().has()`);
 * this function never talks to Clerk.
 */
export async function checkRenderQuota(
	userId: string,
	plan: PlanType,
	supabaseUrl: string,
	serviceRoleKey: string,
): Promise<string | null> {
	const db = createDb(supabaseUrl, serviceRoleKey);

	const { data: user, error } = await db
		.from("users")
		.select("videos_rendered_this_period, period_reset_at")
		.eq("id", userId)
		.single();

	if (error || !user) return null; // user row not found yet — allow

	const now = new Date();
	const resetAt = new Date(user.period_reset_at);

	// Reset if the billing period has rolled over
	if (now >= resetAt) {
		await db
			.from("users")
			.update({
				videos_rendered_this_period: 0,
				period_reset_at: new Date(
					now.getTime() + 30 * 24 * 60 * 60 * 1000,
				).toISOString(),
				updated_at: now.toISOString(),
			})
			.eq("id", userId);
		return null; // fresh period — allow
	}

	const limit = PLAN_LIMITS[plan].rendersPerMonth;
	if (user.videos_rendered_this_period >= limit) {
		return `Monthly render limit reached (${limit} / ${limit}). Upgrade to Pro for more renders.`;
	}

	return null;
}

/**
 * Increment the render counter for a user after a successful video render.
 * Called by the worker — no plan check needed here.
 */
export async function incrementRenderCount(
	userId: string,
	supabaseUrl: string,
	serviceRoleKey: string,
): Promise<void> {
	const db = createDb(supabaseUrl, serviceRoleKey);
	// Fetch current count then increment — avoids needing a custom SQL RPC function
	const { data: user } = await db
		.from("users")
		.select("videos_rendered_this_period")
		.eq("id", userId)
		.single();

	const current = user?.videos_rendered_this_period ?? 0;
	await db
		.from("users")
		.update({
			videos_rendered_this_period: current + 1,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId);
}
