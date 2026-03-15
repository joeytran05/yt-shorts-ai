import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code");
	const niche = req.nextUrl.searchParams.get("state") ?? "";

	if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

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
		return NextResponse.json({
			error: "No refresh token received",
			hint: "Make sure prompt=consent is set and you are a test user",
			data: tokenData,
		});
	}

	// If a niche was specified, save this channel to the channels table
	if (niche) {
		// Fetch the YouTube channel info to get the channel name + thumbnail
		const channelRes = await fetch(
			"https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
			{
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			},
		);
		const channelData = await channelRes.json();
		const channelItem = channelData?.items?.[0];

		const db = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
			{ auth: { persistSession: false } },
		);

		await db.from("channels").upsert(
			{
				niche,
				name: channelItem?.snippet?.title ?? niche,
				refresh_token: tokenData.refresh_token,
				yt_channel_id: channelItem?.id ?? null,
				yt_channel_name: channelItem?.snippet?.title ?? null,
				yt_channel_thumbnail:
					channelItem?.snippet?.thumbnails?.default?.url ?? null,
			},
			{ onConflict: "niche" },
		);

		// Redirect back to settings with a success indicator
		const origin = req.nextUrl.origin;
		return NextResponse.redirect(
			`${origin}/settings?channel_connected=${niche}`,
		);
	}

	// Legacy flow — no niche: show the refresh token for manual .env setup
	return NextResponse.json({
		message:
			"✓ Copy this refresh token to your .env.local as YOUTUBE_REFRESH_TOKEN",
		refresh_token: tokenData.refresh_token,
		access_token: tokenData.access_token,
	});
}
