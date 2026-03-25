import { GeneralSettings } from "@/components/GeneralSettings";
import { MusicLibrary } from "@/components/MusicLibrary";
import { QueryManager } from "@/components/QueryManager";
import { ChannelManager } from "@/components/ChannelManager";
import { BillingPanel } from "@/components/BillingPanel";
import { FeatureLock } from "@/components/FeatureLock";
import { RestartTutorialButton } from "@/components/RestartTutorialButton";
import { Button } from "@/components/ui/button";
import { getSettings, getMusicTracksForUser } from "@/lib/supabase";
import Link from "next/link";
import { getChannels } from "@/lib/actions/channels";
import { ensureUserExists } from "@/lib/actions/onboarding";
import { getAuthContext } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/quota";
import { auth } from "@clerk/nextjs/server";

interface Props {
	searchParams: Promise<{
		channel_connected?: string;
		channel_error?: string;
	}>;
}

export default async function SettingsPage({ searchParams }: Props) {
	const { userId, redirectToSignIn } = await auth();
	if (!userId) return redirectToSignIn();

	const { channel_connected, channel_error } = await searchParams;

	// Ensure user row exists + get plan from Clerk
	const [user, { plan }] = await Promise.all([
		ensureUserExists(),
		getAuthContext(),
	]);

	const [settings, tracks, channelsResult] = await Promise.all([
		getSettings(user.id),
		getMusicTracksForUser(user.id),
		getChannels(),
	]);

	return (
		<main className="max-w-7xl mx-auto px-6 py-10">
			<div className="mb-8 mx-4 flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-black text-text">
						Settings
					</h1>
					<p className="text-sm mt-1 text-muted">
						Configure your subscription, connected channels, YouTube
						queries, and more.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<RestartTutorialButton />
					<Button variant="outline" className="hover:bg-muted">
						<Link
							href="/dashboard"
							className="transition-opacity hover:opacity-75 shrink-0"
						>
							Back
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex justify-center gap-5">
				<div className="flex flex-col gap-5">
					<GeneralSettings initial={settings} />
					<ChannelManager
						initial={channelsResult.ok ? channelsResult.data : []}
						userPlan={plan}
						channelConnected={channel_connected ?? null}
						channelError={channel_error ?? null}
					/>
					{PLAN_LIMITS[plan].musicUpload ? (
						<MusicLibrary initial={tracks} userPlan={plan} />
					) : (
						<FeatureLock feature="Music library &amp; custom uploads">
							<MusicLibrary initial={tracks} userPlan={plan} />
						</FeatureLock>
					)}
				</div>
				{PLAN_LIMITS[plan].customQueries ? (
					<QueryManager
						initial={settings.youtube_queries}
						userPlan={plan}
					/>
				) : (
					<FeatureLock feature="Custom search queries">
						<QueryManager
							initial={settings.youtube_queries}
							userPlan={plan}
						/>
					</FeatureLock>
				)}
			</div>

			<div className="mt-10 flex flex-col gap-5">
				<BillingPanel
					user={user}
					rendersUsed={user.videos_rendered_this_period}
				/>
			</div>
		</main>
	);
}
