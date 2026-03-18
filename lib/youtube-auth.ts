import { createClient } from "@supabase/supabase-js";

// Cache for per-channel tokens, keyed by a prefix of the refresh token
const channelTokenCache = new Map<
	string,
	{ access_token: string; expires_at: number }
>();

async function refreshAccessToken(refreshToken: string): Promise<string> {
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: process.env.YOUTUBE_CLIENT_ID!,
			client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
			refresh_token: refreshToken,
			grant_type: "refresh_token",
		}),
	});

	const data = await res.json();
	if (!data.access_token) {
		throw new Error(
			`Failed to refresh YouTube token: ${JSON.stringify(data)}`,
		);
	}
	return data.access_token;
}

// Per-channel: uses a specific refresh token from the channels table
export async function getYouTubeAccessTokenForChannel(
	refreshToken: string,
): Promise<string> {
	// Use first 16 chars as cache key (enough to differentiate tokens)
	const cacheKey = refreshToken.slice(0, 16);
	const cached = channelTokenCache.get(cacheKey);
	if (cached && Date.now() < cached.expires_at - 60_000) {
		return cached.access_token;
	}

	const access_token = await refreshAccessToken(refreshToken);
	channelTokenCache.set(cacheKey, {
		access_token,
		expires_at: Date.now() + 3_540_000,
	});
	return access_token;
}

/**
 * Look up a user's connected YouTube channel and return a valid access token.
 * Worker-safe: accepts supabaseUrl + serviceRoleKey as params.
 * Returns null if the user has no channel connected.
 */
export async function getAccessTokenForUser(
	userId: string,
	supabaseUrl: string,
	serviceRoleKey: string,
): Promise<string | null> {
	const db = createClient(supabaseUrl, serviceRoleKey, {
		auth: { persistSession: false },
	});

	const { data: channel } = await db
		.from("channels")
		.select("refresh_token")
		.eq("user_id", userId)
		.maybeSingle();

	if (!channel?.refresh_token) return null;

	return getYouTubeAccessTokenForChannel(channel.refresh_token);
}
