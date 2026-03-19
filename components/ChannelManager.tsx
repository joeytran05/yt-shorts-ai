"use client";

import { useState, useTransition } from "react";
import { Trash2, Youtube, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastMessage } from "@/lib/utils";
import { deleteChannel } from "@/lib/actions/channels";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";
import type { Channel } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface Props {
	initial: Channel[];
	userPlan: PlanType;
	channelConnected?: string | null;
	channelError?: string | null;
}

export function ChannelManager({
	initial,
	userPlan,
	channelConnected,
	channelError,
}: Props) {
	const [channels, setChannels] = useState(initial);
	const [isPending, startTransition] = useTransition();

	const limit = PLAN_LIMITS[userPlan].channels;
	const canAddMore = channels.length < limit;

	const handleConnect = () => {
		window.location.href = "/api/auth/youtube";
	};

	const handleDelete = (id: string) => {
		startTransition(async () => {
			const result = await deleteChannel(id);
			if (result.ok) {
				setChannels((prev) => prev.filter((c) => c.id !== id));
				toastMessage("Channel disconnected", true);
			} else {
				toastMessage(`Error: ${result.error}`, false);
			}
		});
	};

	return (
		<div className="rounded-xl border border-border p-5 bg-card">
			<div className="flex items-center gap-2 mb-4">
				<Youtube size={16} className="text-publish" />
				<h2 className="text-sm font-bold text-text">
					YouTube Channels
				</h2>
				<span className="text-xs text-muted ml-1">
					{channels.length} / {limit} connected
				</span>
			</div>

			{channelConnected && (
				<div className="mb-4 rounded-lg px-3 py-2 text-xs text-publish bg-publish/10 border border-publish/25">
					✓ YouTube channel connected successfully
				</div>
			)}

			{channelError && (
				<div className="mb-4 rounded-lg px-3 py-2 text-xs text-danger bg-danger/10 border border-danger/25">
					{channelError}
				</div>
			)}

			{/* Channel list */}
			{channels.length > 0 && (
				<div className="flex flex-col gap-2 mb-3">
					{channels.map((ch) => (
						<div
							key={ch.id}
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border bg-card-hover"
						>
							{ch.yt_channel_thumbnail ? (
								<Image
									src={ch.yt_channel_thumbnail}
									alt=""
									width={32}
									height={32}
									className="rounded-full shrink-0"
								/>
							) : (
								<div className="w-8 h-8 rounded-full bg-dim flex items-center justify-center shrink-0">
									<Youtube size={14} className="text-muted" />
								</div>
							)}

							<div className="flex-1 min-w-0">
								{ch.yt_channel_id ? (
									<Link
										href={`https://www.youtube.com/channel/${ch.yt_channel_id}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<p className="text-sm font-semibold text-text truncate hover:underline">
											{ch.yt_channel_name ?? ch.name}
										</p>
									</Link>
								) : (
									<p className="text-sm font-semibold text-text truncate">
										{ch.yt_channel_name ?? ch.name}
									</p>
								)}
								<p className="text-xs text-muted">Connected</p>
							</div>

							<button
								onClick={() => handleDelete(ch.id)}
								disabled={isPending}
								className="text-muted hover:text-danger transition-colors shrink-0 ml-1"
								title="Disconnect channel"
							>
								<Trash2 size={16} />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Empty state */}
			{channels.length === 0 && (
				<div className="flex flex-col items-center gap-3 py-6 text-center mb-3">
					<div className="w-10 h-10 rounded-full bg-dim flex items-center justify-center">
						<Youtube size={18} className="text-muted" />
					</div>
					<div>
						<p className="text-sm text-text font-medium">
							No channels connected
						</p>
						<p className="text-xs text-muted mt-0.5">
							Connect a YouTube channel to enable uploads
						</p>
					</div>
				</div>
			)}

			{/* Connect button — shown when below plan limit */}
			{canAddMore ? (
				<Button
					size="sm"
					onClick={handleConnect}
					className="w-full bg-publish text-[#071a10] hover:bg-publish/90"
				>
					<Plus size={13} className="mr-1.5" />
					Connect{channels.length > 0 ? " Another" : ""} YouTube Channel
				</Button>
			) : (
				<div className="flex items-center justify-between rounded-lg px-3 py-2 bg-dim border border-border">
					<p className="text-xs text-muted">
						Channel limit reached for{" "}
						<span className="capitalize">{userPlan}</span> plan
					</p>
					<button
						onClick={() =>
							document
								.getElementById("billing")
								?.scrollIntoView({ behavior: "smooth", block: "start" })
						}
						className="text-xs text-publish hover:underline shrink-0 ml-3"
					>
						Upgrade →
					</button>
				</div>
			)}
		</div>
	);
}
