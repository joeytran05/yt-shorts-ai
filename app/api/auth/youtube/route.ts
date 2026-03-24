import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type PlanType } from "@/lib/quota";

export async function GET(req: NextRequest) {
	const { userId, has } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Resolve plan and enforce channel limit before starting OAuth flow
	const plan: PlanType = has({ plan: "pro" })
		? "pro"
		: has({ plan: "creator" })
			? "creator"
			: "free";

	const db = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
	const { count } = await db
		.from("channels")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId);

	const limit = PLAN_LIMITS[plan].channels;
	if ((count ?? 0) >= limit) {
		return NextResponse.redirect(
			new URL(
				`/settings?channel_error=${encodeURIComponent(
					`Your ${plan} plan supports up to ${limit} channel(s). Upgrade to connect more.`,
				)}`,
				req.url,
			),
		);
	}

	// Pass userId as OAuth state so the callback knows which user to save to
	const params = new URLSearchParams({
		client_id: process.env.YOUTUBE_CLIENT_ID!,
		redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
		response_type: "code",
		scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
		access_type: "offline", // gives us a refresh token
		prompt: "consent", // forces refresh token every time
		state: userId,
	});

	return NextResponse.redirect(
		`https://accounts.google.com/o/oauth2/v2/auth?${params}`,
	);
}
