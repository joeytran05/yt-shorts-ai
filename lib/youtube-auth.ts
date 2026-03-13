let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getYouTubeAccessToken(): Promise<string> {
	// Return cached token if still valid (with 60s buffer)
	if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
		return cachedToken.access_token;
	}

	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.YOUTUBE_CLIENT_ID!,
			client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
			refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
			grant_type: "refresh_token",
		}),
	});

	const data = await res.json();
	if (!data.access_token) {
		throw new Error(
			`Failed to refresh YouTube token: ${JSON.stringify(data)}`,
		);
	}

	cachedToken = {
		access_token: data.access_token,
		expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
	};

	return cachedToken.access_token;
}
