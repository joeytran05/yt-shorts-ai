import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
