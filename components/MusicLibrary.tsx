"use client";

import { useState, useTransition, useRef } from "react";
import { Trash2, Upload, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toastMessage } from "@/lib/utils";
import { deleteMusicTrack, uploadMusicTrack } from "@/lib/actions/settings";

const MOODS = [
	"upbeat",
	"motivational",
	"chill",
	"dramatic",
	"funny",
	"corporate",
] as const;
type Mood = (typeof MOODS)[number];

export interface Track {
	id: string;
	name: string;
	mood: Mood;
	url: string;
	duration: number;
}

const MOOD_COLORS: Record<Mood, string> = {
	upbeat: "var(--publish)",
	motivational: "var(--score)",
	chill: "var(--script)",
	dramatic: "var(--danger)",
	funny: "var(--review)",
	corporate: "var(--muted-fg)",
};

export function MusicLibrary({ initial }: { initial: Track[] }) {
	const [tracks, setTracks] = useState(initial);
	const [mood, setMood] = useState<Mood>("upbeat");
	const [isPending, start] = useTransition();
	const fileRef = useRef<HTMLInputElement>(null);

	const show = (text: string, ok: boolean) => {
		toastMessage(text, ok, 3500);
	};
	const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const fd = new FormData();
		fd.append("file", file);
		fd.append("mood", mood);
		fd.append("name", file.name.replace(/\.[^.]+$/, ""));

		start(async () => {
			const result = await uploadMusicTrack(fd);
			if (result.ok) {
				setTracks((prev) => [...prev, result.data!]);
				show("✓ Track uploaded", true);
			} else {
				show(`✗ ${result.error}`, false);
			}
			if (fileRef.current) fileRef.current.value = "";
		});
	};

	const handleDelete = (id: string) =>
		start(async () => {
			const result = await deleteMusicTrack(id);
			if (result.ok) {
				setTracks((prev) => prev.filter((t) => t.id !== id));
				show("Track removed", true);
			} else {
				show(`✗ ${result.error}`, false);
			}
		});

	return (
		<div className="rounded-xl p-5 bg-card border border-border">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-sm text-text font-semibold flex items-center gap-2">
						<Music size={14} className="text-script" />
						Music Library
					</h2>
					<p className="text-xs mt-0.5 text-muted">
						{tracks.length} tracks · upload your own
					</p>
				</div>
				<label className="shrink-0">
					<input
						ref={fileRef}
						type="file"
						accept="audio/mp3,audio/mpeg,audio/*"
						onChange={handleUpload}
						className="hidden"
					/>
					<Button
						size="sm"
						disabled={isPending}
						onClick={() => fileRef.current?.click()}
						className="bg-script text-white hover:bg-script/90"
						type="button"
					>
						<Upload size={12} className="mr-1.5" />
						{isPending ? "Uploading…" : `Upload as ${mood}`}
					</Button>
				</label>
			</div>

			{/* Upload row */}
			<div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-surface border border-border">
				{/* Mood selector */}
				<div className="flex gap-1 flex-wrap flex-1">
					{MOODS.map((m) => (
						<button
							key={m}
							onClick={() => setMood(m)}
							className="px-3 py-1 rounded-md text-xs font-medium tracking-wide transition-all"
							style={{
								background:
									mood === m
										? `${MOOD_COLORS[m]}20`
										: "transparent",
								border: `1px solid ${mood === m ? MOOD_COLORS[m] : "var(--border)"}`,
								color:
									mood === m
										? MOOD_COLORS[m]
										: "var(--muted)",
							}}
						>
							{m}
						</button>
					))}
				</div>
			</div>

			{/* Hint */}
			<p className="text-xs mb-3 text-muted">
				Download free tracks from{" "}
				<a
					href="https://pixabay.com/music/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-score"
				>
					pixabay.com/music
				</a>{" "}
				or{" "}
				<a
					href="https://mixkit.co/free-stock-music/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-score"
				>
					mixkit.co
				</a>{" "}
				· both free for commercial use
			</p>

			{/* Track list */}
			{tracks.length === 0 ? (
				<div className="text-center py-8 text-muted">
					<Music size={24} className="mx-auto mb-2 opacity-40" />
					<p className="text-xs">
						No tracks yet — upload your first one
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-1.5">
					{tracks.map((track) => (
						<div
							key={track.id}
							className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface border border-border"
						>
							<Music
								size={14}
								style={{
									color:
										MOOD_COLORS[track.mood as Mood] ??
										"var(--muted)",
									flexShrink: 0,
								}}
							/>
							<span className="text-xs flex-1 truncate text-text">
								{track.name}
							</span>
							<span className="text-xs shrink-0 text-muted">
								{Math.floor(track.duration / 60)}:
								{(track.duration % 60)
									.toString()
									.padStart(2, "0")}
							</span>
							<Badge
								className="text-xs px-1.5 shrink-0"
								style={{
									background: `${MOOD_COLORS[track.mood as Mood]}18`,
									color:
										MOOD_COLORS[track.mood as Mood] ??
										"var(--muted)",
									border: `1px solid ${MOOD_COLORS[track.mood as Mood] ?? "var(--muted)"}30`,
								}}
							>
								{track.mood}
							</Badge>
							<audio
								controls
								src={track.url}
								className="h-6 w-24 shrink-0"
							/>
							<button
								onClick={() => handleDelete(track.id)}
								disabled={isPending}
								className="shrink-0 hover:opacity-75 transition-opacity"
							>
								<Trash2 size={14} className="text-danger" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
