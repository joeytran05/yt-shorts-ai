/**
 * lib/auth.ts
 *
 * Server-side auth context helper.
 * Returns the authenticated Clerk userId AND the user's plan (resolved from
 * the users table in Supabase) in a single call.
 *
 * Usage in server actions:
 *   const { userId, plan } = await getAuthContext();
 */

import { auth } from "@clerk/nextjs/server";
import { getUser } from "@/lib/supabase";
import type { PlanType } from "@/lib/quota";

export interface AuthContext {
	userId: string;
	plan: PlanType;
}

/**
 * Resolve the current user's ID and plan from Clerk + Supabase.
 * Redirects to sign-in if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext> {
	const { userId, redirectToSignIn } = await auth();
	if (!userId) return redirectToSignIn();

	const user = await getUser(userId);
	const plan: PlanType = (user?.plan as PlanType) ?? "free";

	return { userId, plan };
}
