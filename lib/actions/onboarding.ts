"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db, getUser } from "@/lib/supabase";
import type { User, YoutubeQuery } from "@/types";

const STARTER_QUERIES: YoutubeQuery[] = [
	{ query: "life hacks shorts viral", enabled: true, custom: false },
	{ query: "mind blowing facts shorts", enabled: true, custom: false },
	{ query: "money saving tips shorts", enabled: true, custom: false },
	{ query: "fitness tips shorts viral", enabled: true, custom: false },
	{ query: "tech tricks iphone shortcuts", enabled: true, custom: false },
];

/**
 * Ensure the current Clerk user has a row in our `users` table and a seeded
 * `settings` row.  Idempotent — returns immediately if the user already exists.
 *
 * Call this at the top of every server-rendered page that requires auth:
 *   const user = await ensureUserExists();
 */
export async function ensureUserExists(): Promise<User> {
	const { userId, redirectToSignIn } = await auth();
	if (!userId) return redirectToSignIn();

	// Fast path — user already exists
	const existing = await getUser(userId);
	if (existing) return existing;

	// Slow path — first sign-in: create user + seed settings
	const clerkUser = await currentUser();
	const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

	// Insert user row
	const { data: newUser, error: userErr } = await db
		.from("users")
		.insert({
			id: userId,
			email,
			videos_rendered_this_period: 0,
			period_reset_at: new Date(
				Date.now() + 30 * 24 * 60 * 60 * 1000,
			).toISOString(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (userErr) throw new Error(`Failed to create user: ${userErr.message}`);

	// Seed settings row with starter queries
	await db.from("settings").upsert(
		{
			user_id: userId,
			youtube_queries: STARTER_QUERIES,
			min_views: 100000,
			per_query: 1,
			target_niches: [],
			auto_approve_above: null,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id" },
	);

	return newUser as User;
}
