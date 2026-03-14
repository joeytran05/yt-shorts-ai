"use client";

import { useState, useTransition, useEffect } from "react";
import { Music, X } from "lucide-react";
import { getMusicTracks } from "@/lib/actions/settings";
import { setMusicTrack } from "@/lib/actions/production";
import { Idea } from "@/types";

interface Track {
	id: string;
	name: string;
	mood: string;
	url: string;
	duration: number;
}

const MOOD_COLORS: Record<string, string> = {
	upbeat: "var(--publish)",
	motivational: "var(--score)",
	chill: "var(--script)",
	dramatic: "var(--danger)",
	funny: "var(--review)",
	corporate: "var(--muted-fg)",
};

interface Props {
	ideaId: string;
	musicSuggestion: string | null;
	currentMusicUrl: string | null;
	locked: boolean;
	onUpdate: (patch: Partial<Idea>) => void;
	onToast: (msg: string, ok: boolean) => void;
}

export function MusicSelector({
	ideaId,
	musicSuggestion,
	currentMusicUrl,
	locked,
	onUpdate,
	onToast,
}: Props) {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [expanded, setExpanded] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [isPending, start] = useTransition();

	useEffect(() => {
		const fetchTracks = async () => {
			setLoading(true);
			const result = await getMusicTracks();
			if (result.ok) setTracks(result.data ?? []);
			setLoading(false);
		};
		fetchTracks();
	}, []);

	const selectedTrack = tracks.find((t) => t.url === currentMusicUrl);

	// ── Locked state — just show what's selected, no interaction ──
	if (locked) {
		return (
			<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-surface border border-border">
				<Music size={14} className="text-script shrink-0" />
				<span className="text-xs flex-1 truncate text-script">
					{selectedTrack
						? `${selectedTrack.name} (${selectedTrack.mood})`
						: currentMusicUrl
							? "Auto-matched track"
							: `Auto · ${musicSuggestion ?? "mood match"}`}
				</span>
				<span className="text-xs px-1.5 py-0.5 rounded bg-dim text-white">
					🔒 Locked
				</span>
			</div>
		);
	}

	const select = (trackId: string | null) =>
		start(async () => {
			const result = await setMusicTrack(ideaId, trackId);
			if (result.ok) {
				onUpdate(result.data);
				onToast(
					trackId ? "🎵 Music selected" : "Music set to auto",
					true,
				);
				setExpanded(false);
				setPreview(null);
			} else {
				onToast(`✗ ${result.error}`, false);
			}
		});

	return (
		<div className="mt-3">
			{/* Collapsed row */}
			<button
				onClick={() => setExpanded((o) => !o)}
				className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-all"
				style={{
					background: expanded ? "var(--dim)" : "var(--surface)",
					border: `1px solid ${expanded ? "var(--border-active)" : "var(--border)"}`,
				}}
			>
				<Music size={14} className="text-script shrink-0" />
				<span className="text-xs flex-1 text-muted-fg">
					{selectedTrack ? (
						<>
							<span className="text-text">
								{selectedTrack.name}
							</span>
							<span className="ml-2 text-muted">
								({selectedTrack.mood})
							</span>
						</>
					) : currentMusicUrl ? (
						<span className="text-muted">Auto-matched track</span>
					) : (
						<span className="text-muted">
							Auto ·{" "}
							<span className="text-script">
								{musicSuggestion ?? "mood match"}
							</span>
						</span>
					)}
				</span>
				<span className="text-xs text-muted">
					{expanded ? "▲" : "▼"}
				</span>
			</button>

			{/* Expanded picker */}
			{expanded && (
				<div className="mt-1 rounded-lg overflow-hidden animate-slide-up border border-border-active bg-surface">
					{/* Auto option */}
					<button
						onClick={() => select(null)}
						disabled={isPending}
						className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-all hover:opacity-80"
						style={{
							background: !currentMusicUrl
								? "var(--dim)"
								: "transparent",
							borderBottom: "1px solid var(--border)",
						}}
					>
						<div
							className="w-1.5 h-1.5 rounded-full shrink-0"
							style={{
								background: !currentMusicUrl
									? "var(--script)"
									: "var(--dim)",
							}}
						/>
						<div className="flex-1 min-w-0">
							<p className="text-xs text-text">Auto</p>
							<p className="text-xs mt-0.5 text-muted">
								GPT-5 suggested:{" "}
								{musicSuggestion ?? "background"}
							</p>
						</div>
					</button>

					{/* Loading state */}
					{loading && (
						<div className="px-3 py-4 text-center text-xs animate-pulse-slow text-muted">
							Loading tracks…
						</div>
					)}

					{/* Empty state */}
					{!loading && tracks.length === 0 && (
						<div className="px-3 py-4 text-center text-xs text-muted">
							No tracks in library —{" "}
							<a href="/settings" className="text-score">
								add some in Settings
							</a>
						</div>
					)}

					{/* Track list */}
					{!loading &&
						tracks.map((track) => {
							const isSelected = track.url === currentMusicUrl;
							const color =
								MOOD_COLORS[track.mood] ?? "var(--muted-fg)";

							return (
								<div
									key={track.id}
									className="flex items-center gap-2 px-3 py-2 transition-all border-b border-border"
									style={{
										background: isSelected
											? "var(--dim)"
											: "transparent",
									}}
								>
									{/* Select button */}
									<button
										onClick={() => select(track.id)}
										disabled={isPending}
										className="flex items-center gap-2 flex-1 min-w-0 text-left"
									>
										<div
											className="w-1.5 h-1.5 rounded-full shrink-0"
											style={{
												background: isSelected
													? color
													: "var(--dim)",
											}}
										/>
										<p
											className="text-xs flex-1 truncate"
											style={{
												color: isSelected
													? "var(--text)"
													: "var(--muted-fg)",
											}}
										>
											{track.name}
										</p>
										<span
											className="text-xs px-1.5 py-0.5 rounded shrink-0"
											style={{
												background: `${color}18`,
												color,
												border: `1px solid ${color}30`,
											}}
										>
											{track.mood}
										</span>
										<span className="text-xs shrink-0 text-muted">
											{Math.floor(track.duration / 60)}:
											{(track.duration % 60)
												.toString()
												.padStart(2, "0")}
										</span>
									</button>

									{/* Preview toggle */}
									<button
										onClick={() =>
											setPreview((prev) =>
												prev === track.url
													? null
													: track.url,
											)
										}
										className="shrink-0 text-xs px-2 py-0.5 rounded transition-all"
										style={{
											background:
												preview === track.url
													? `${color}20`
													: "var(--dim)",
											color:
												preview === track.url
													? color
													: "var(--muted)",
											border: `1px solid ${preview === track.url ? color : "transparent"}`,
										}}
									>
										{preview === track.url ? "■" : "▶"}
									</button>
								</div>
							);
						})}

					{/* Audio preview */}
					{/* {preview && (
						<div className="px-3 py-2 flex items-center gap-2 border-t border-border bg-dim">
							<Music size={10} className="text-script shrink-0" />
							<audio
								key={preview}
								controls
								autoPlay
								src={preview}
								className="flex-1 h-6"
							/>
							<button onClick={() => setPreview(null)}>
								<X size={12} className="text-muted" />
							</button>
						</div>
					)} */}

					{/* Audio preview */}
					{preview && (
						<audio
							key={preview}
							controls
							autoPlay
							src={preview}
							className="flex-1 h-6 hidden"
						/>
					)}
				</div>
			)}
		</div>
	);
}
