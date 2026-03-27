"use server";

import { db } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";

export async function expressSubscriptionInterest(
	plan: string,
): Promise<{ ok: boolean; alreadyRegistered?: boolean }> {
	try {
		const { userId } = await getAuthContext();
		const clerkUser = await currentUser();
		const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

		// Check if already registered interest for this plan
		const { data: existing } = await db
			.from("subscription_interest")
			.select("id")
			.eq("user_id", userId)
			.eq("plan", plan)
			.maybeSingle();

		if (existing) return { ok: true, alreadyRegistered: true };

		await db.from("subscription_interest").insert({
			user_id: userId,
			plan,
			email,
		});

		return { ok: true };
	} catch (err) {
		console.error("[billing] expressSubscriptionInterest error:", err);
		return { ok: false };
	}
}
