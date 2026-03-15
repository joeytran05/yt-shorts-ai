"use client";

import { useState, useTransition } from "react";
import { Trash2, Youtube, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toastMessage } from "@/lib/utils";
import { deleteChannel } from "@/lib/actions/channels";
import type { Channel, NicheType } from "@/types";
import { NICHE_EMOJI } from "@/types";
import Image from "next/image";
import Link from "next/link";

const ALL_NICHES: NicheType[] = [
	"life_hacks",
	"funny_fails",
	"motivation",
	"tech_tips",
	"diy",
	"asmr",
	"fitness",
	"finance",
	"food",
	"travel",
	"gaming",
	"beauty",
	"pets",
	"education",
	"news",
	"other",
];

const NICHE_LABELS: Record<NicheType, string> = {
	life_hacks: "Life Hacks",
	funny_fails: "Funny Fails",
	motivation: "Motivation",
	tech_tips: "Tech Tips",
	diy: "DIY",
	asmr: "ASMR",
	fitness: "Fitness",
	finance: "Finance",
	food: "Food",
	travel: "Travel",
	gaming: "Gaming",
	beauty: "Beauty",
	pets: "Pets",
	education: "Education",
	news: "News",
	other: "Other",
};

interface Props {
	initial: Channel[];
	channelConnected?: string | null;
}

export function ChannelManager({ initial, channelConnected }: Props) {
	const [channels, setChannels] = useState(initial);
	const [selectedNiche, setSelectedNiche] = useState<NicheType | "">("");
	const [isPending, startTransition] = useTransition();

	const connectedNiches = new Set(channels.map((c) => c.niche));
	const availableNiches = ALL_NICHES.filter((n) => !connectedNiches.has(n));

	const handleConnect = () => {
		if (!selectedNiche) return;
		window.location.href = `/api/auth/youtube?niche=${selectedNiche}`;
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
					one channel per niche
				</span>
			</div>

			{channelConnected && (
				<div className="mb-4 rounded-lg px-3 py-2 text-xs text-publish bg-publish/10 border border-publish/25">
					✓ Channel connected for niche:{" "}
					<strong>{channelConnected}</strong>
				</div>
			)}

			{/* Connected channels list */}
			{channels.length > 0 && (
				<div className="flex flex-col gap-2 mb-4">
					{channels.map((ch) => (
						<div
							key={ch.id}
							className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-border bg-card-hover"
						>
							{ch.yt_channel_thumbnail ? (
								<Image
									src={ch.yt_channel_thumbnail}
									alt=""
									width={28}
									height={28}
									className="rounded-full shrink-0"
								/>
							) : (
								<div className="w-7 h-7 rounded-full bg-dim flex items-center justify-center text-sm shrink-0">
									{NICHE_EMOJI[ch.niche] ?? "📌"}
								</div>
							)}

							<div className="flex-1 min-w-0">
								<Link
									href={`https://www.youtube.com/channel/${ch.yt_channel_id}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<p className="text-sm font-semibold text-text truncate hover:underline">
										{ch.yt_channel_name ?? ch.name}
									</p>
								</Link>
							</div>

							<Badge
								className="text-xs px-2 py-0.5 shrink-0"
								style={{
									background: "rgba(99,102,241,0.12)",
									color: "#818cf8",
									border: "1px solid rgba(99,102,241,0.25)",
								}}
							>
								{NICHE_EMOJI[ch.niche]} {NICHE_LABELS[ch.niche]}
							</Badge>

							<button
								onClick={() => handleDelete(ch.id)}
								disabled={isPending}
								className="text-muted hover:text-danger transition-colors shrink-0 ml-1"
								title="Disconnect channel"
							>
								<Trash2 size={14} />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Connect a new channel */}
			{availableNiches.length > 0 && (
				<div className="flex items-center gap-2">
					<Select
						value={selectedNiche}
						onValueChange={(v) => setSelectedNiche(v as NicheType)}
					>
						<SelectTrigger className="h-8 text-xs flex-1 hover:bg-gray-800">
							<SelectValue placeholder="Select niche…" />
						</SelectTrigger>
						<SelectContent className="bg-bg border border-border">
							{availableNiches.map((n) => (
								<SelectItem
									key={n}
									value={n}
									className="border-b border-border last:border-0 hover:bg-gray-800 text-xs"
								>
									{NICHE_EMOJI[n]} {NICHE_LABELS[n]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						size="sm"
						disabled={!selectedNiche}
						onClick={handleConnect}
						className="shrink-0 bg-publish text-[#071a10] hover:bg-publish/90"
					>
						<Plus size={13} className="mr-1" />
						Connect
					</Button>
				</div>
			)}

			{availableNiches.length === 0 && channels.length > 0 && (
				<p className="text-xs text-muted">
					All niches have connected channels.
				</p>
			)}

			<p className="text-xs text-muted mt-3">
				Videos are automatically uploaded to the matching channel based
				on their niche. Falls back to the default channel if no match.
			</p>
		</div>
	);
}
