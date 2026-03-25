import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code");
	const userId = req.nextUrl.searchParams.get("state") ?? "";

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
		return NextResponse.json({
			error: "No refresh token received",
			hint: "Make sure prompt=consent is set and you are a test user",
			data: tokenData,
		});
	}

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

	const { error: channelError } = await db.from("channels").upsert(
		{
			user_id: userId,
			name: channelItem?.snippet?.title ?? "My Channel",
			refresh_token: tokenData.refresh_token,
			yt_channel_id: channelItem?.id ?? null,
			yt_channel_name: channelItem?.snippet?.title ?? null,
			yt_channel_thumbnail:
				channelItem?.snippet?.thumbnails?.default?.url ?? null,
		},
		{ onConflict: "user_id,yt_channel_id" },
	);

	if (channelError) {
		console.error("Failed to save channel:", channelError);
		const origin = req.nextUrl.origin;
		return NextResponse.redirect(
			`${origin}/settings?channel_error=${encodeURIComponent(channelError.message)}`,
		);
	}

	revalidatePath("/settings");

	// Redirect back to settings with a success indicator
	const origin = req.nextUrl.origin;
	return NextResponse.redirect(`${origin}/settings?channel_connected=1`);
}
