import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code");
	const userId = req.nextUrl.searchParams.get("state") ?? "";
	const origin = req.nextUrl.origin;

	if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });
	if (!userId)
		return NextResponse.json({ error: "No user state" }, { status: 400 });

	const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: process.env.YOUTUBE_CLIENT_ID!,
			client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
			redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
			grant_type: "authorization_code",
		}),
	});

	const tokenData = await tokenRes.json();

	if (!tokenData.refresh_token) {
		console.error("[youtube-callback] No refresh token:", tokenData);
		return NextResponse.redirect(
			`${origin}/settings?channel_error=${encodeURIComponent(
				"No refresh token received. Try disconnecting and reconnecting.",
			)}`,
		);
	}

	// Fetch the YouTube channel info to get the channel name + thumbnail
	const channelRes = await fetch(
		"https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
		{ headers: { Authorization: `Bearer ${tokenData.access_token}` } },
	);
	const channelData = await channelRes.json();
	const channelItem = channelData?.items?.[0];
	const ytChannelId = channelItem?.id ?? null;

	console.log("[youtube-callback] userId:", userId);
	console.log("[youtube-callback] yt_channel_id:", ytChannelId);
	console.log("[youtube-callback] yt_channel_name:", channelItem?.snippet?.title);

	const db = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);

	// Check if this user already has this YouTube channel connected
	const { data: existing } = await db
		.from("channels")
		.select("id")
		.eq("user_id", userId)
		.eq("yt_channel_id", ytChannelId)
		.maybeSingle();

	let channelError: { message: string } | null = null;

	if (existing) {
		// Update existing row (refresh token may have changed)
		const { error } = await db
			.from("channels")
			.update({
				name: channelItem?.snippet?.title ?? "My Channel",
				refresh_token: tokenData.refresh_token,
				yt_channel_name: channelItem?.snippet?.title ?? null,
				yt_channel_thumbnail:
					channelItem?.snippet?.thumbnails?.default?.url ?? null,
			})
			.eq("id", existing.id);
		if (error) channelError = error;
	} else {
		// Insert new channel for this user
		const { error } = await db.from("channels").insert({
			user_id: userId,
			name: channelItem?.snippet?.title ?? "My Channel",
			refresh_token: tokenData.refresh_token,
			yt_channel_id: ytChannelId,
			yt_channel_name: channelItem?.snippet?.title ?? null,
			yt_channel_thumbnail:
				channelItem?.snippet?.thumbnails?.default?.url ?? null,
		});
		if (error) channelError = error;
	}

	if (channelError) {
		console.error("[youtube-callback] DB error:", channelError);
		return NextResponse.redirect(
			`${origin}/settings?channel_error=${encodeURIComponent(channelError.message)}`,
		);
	}

	console.log("[youtube-callback] Channel saved successfully for user:", userId);
	revalidatePath("/settings");
	return NextResponse.redirect(`${origin}/settings?channel_connected=1`);
}
