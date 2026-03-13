import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code");
	if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

	const res = await fetch("https://oauth2.googleapis.com/token", {
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

	const data = await res.json();

	if (!data.refresh_token) {
		return NextResponse.json({
			error: "No refresh token received",
			hint: "Make sure prompt=consent is set and you are a test user",
			data,
		});
	}

	// Show the refresh token — copy it to .env.local
	return NextResponse.json({
		message:
			"✓ Copy this refresh token to your .env.local as YOUTUBE_REFRESH_TOKEN",
		refresh_token: data.refresh_token,
		access_token: data.access_token, // short-lived, don't save this
	});
}
