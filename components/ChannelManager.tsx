"use client";

import { useState, useTransition } from "react";
import { Trash2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastMessage } from "@/lib/utils";
import { deleteChannel } from "@/lib/actions/channels";
import type { Channel } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface Props {
	initial: Channel[];
	channelConnected?: string | null;
	channelError?: string | null;
}

export function ChannelManager({
	initial,
	channelConnected,
	channelError,
}: Props) {
	const [channels, setChannels] = useState(initial);
	const [isPending, startTransition] = useTransition();

	// Each user has at most one channel
	const channel = channels[0] ?? null;

	const handleConnect = () => {
		window.location.href = "/api/auth/youtube";
	};

	const handleDelete = (id: string) => {
		startTransition(async () => {
			const result = await deleteChannel(id);
			if (result.ok) {
				setChannels([]);
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
				<h2 className="text-sm font-bold text-text">YouTube Channel</h2>
				<span className="text-xs text-muted ml-1">
					one channel per account
				</span>
			</div>

			{channelConnected && (
				<div className="mb-4 rounded-lg px-3 py-2 text-xs text-publish bg-publish/10 border border-publish/25">
					✓ YouTube channel connected successfully
				</div>
			)}

			{channelError && (
				<div className="mb-4 rounded-lg px-3 py-2 text-xs text-danger bg-danger/10 border border-danger/25">
					Failed to save channel: {channelError}
				</div>
			)}

			{channel ? (
				<div className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border bg-card-hover mb-3">
					{channel.yt_channel_thumbnail ? (
						<Image
							src={channel.yt_channel_thumbnail}
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
						{channel.yt_channel_id ? (
							<Link
								href={`https://www.youtube.com/channel/${channel.yt_channel_id}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<p className="text-sm font-semibold text-text truncate hover:underline">
									{channel.yt_channel_name ?? channel.name}
								</p>
							</Link>
						) : (
							<p className="text-sm font-semibold text-text truncate">
								{channel.yt_channel_name ?? channel.name}
							</p>
						)}
						<p className="text-xs text-muted">Connected</p>
					</div>

					<button
						onClick={() => handleDelete(channel.id)}
						disabled={isPending}
						className="text-muted hover:text-danger transition-colors shrink-0 ml-1"
						title="Disconnect channel"
					>
						<Trash2 size={16} />
					</button>
				</div>
			) : (
				<div className="flex flex-col items-center gap-3 py-6 text-center">
					<div className="w-10 h-10 rounded-full bg-dim flex items-center justify-center">
						<Youtube size={18} className="text-muted" />
					</div>
					<div>
						<p className="text-sm text-text font-medium">
							No channel connected
						</p>
						<p className="text-xs text-muted mt-0.5">
							Connect your YouTube channel to enable uploads
						</p>
					</div>
					<Button
						size="sm"
						onClick={handleConnect}
						className="bg-publish text-[#071a10] hover:bg-publish/90"
					>
						<Youtube size={13} className="mr-1.5" />
						Connect YouTube Channel
					</Button>
				</div>
			)}

			{channel && (
				<p className="text-xs text-muted">
					Videos will be uploaded to this channel. Reconnect to switch
					channels.
				</p>
			)}
		</div>
	);
}
