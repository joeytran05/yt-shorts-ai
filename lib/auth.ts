/**
 * lib/auth.ts
 *
 * Server-side auth context helper.
 * Returns the authenticated Clerk userId AND the user's plan (resolved from
 * Clerk session claims via has()) in a single call.
 *
 * Usage in server actions:
 *   const { userId, plan } = await getAuthContext();
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { PlanType } from "@/lib/quota";

export interface AuthContext {
	userId: string;
	plan: PlanType;
}

/**
 * Resolve the current user's ID and plan from the Clerk session.
 * Redirects to sign-in if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext> {
	const { userId, has, redirectToSignIn } = await auth();
	if (!userId) return redirectToSignIn();

	const plan: PlanType = has({ plan: "business" })
		? "business"
		: has({ plan: "pro" })
			? "pro"
			: "free";

	return { userId, plan };
}
