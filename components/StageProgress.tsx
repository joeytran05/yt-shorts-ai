import { IdeaStatus } from "@/types";

// ── Per-stage progress steps ──────────────────────────────────────
const RENDER_STEPS = [
	{ key: "planning", label: "Planning scenes" },
	{ key: "clips_fetching", label: "Fetching clips" },
	{ key: "clips_ready", label: "Clips ready" },
	{ key: "rendering", label: "Rendering" },
	{ key: "done", label: "Done" },
];

// ── Spinning indicator ────────────────────────────────────────────
export function Spinner({ color = "var(--score)" }: { color?: string }) {
	return (
		<svg
			width={14}
			height={14}
			viewBox="0 0 14 14"
			className="animate-spin shrink-0"
		>
			<circle
				cx={7}
				cy={7}
				r={5}
				fill="none"
				stroke="var(--dim)"
				strokeWidth={2}
			/>
			<path
				d="M7 2 A5 5 0 0 1 12 7"
				fill="none"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</svg>
	);
}

// ── Stage-specific progress UI ────────────────────────────────────
export default function StageProgress({
	status,
	scenesStatus,
}: {
	status: IdeaStatus;
	scenesStatus?: string | null;
}) {
	console.log(status);
	// Script generation
	if (status === "approved")
		return (
			<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-surface border border-border">
				<Spinner color="var(--script)" />
				<span className="text-xs animate-pulse-slow text-script">
					Generating script…
				</span>
			</div>
		);

	// Voiceover generation
	if (status === "generating_voice")
		return (
			<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-surface border border-border">
				<Spinner color="var(--prod)" />
				<span className="text-xs animate-pulse-slow text-prod">
					Generating voiceover via ElevenLabs…
				</span>
			</div>
		);

	// Video render pipeline — show step-by-step progress
	if (status === "generating_video") {
		const currentIdx = RENDER_STEPS.findIndex(
			(s) => s.key === scenesStatus,
		);
		return (
			<div className="mt-3 rounded-lg p-3 bg-surface border border-border">
				<div className="flex items-center gap-2 mb-3">
					<Spinner color="var(--prod)" />
					<span className="text-xs tracking-widest text-prod">
						RENDERING VIDEO
					</span>
				</div>
				<div className="flex gap-1">
					{RENDER_STEPS.map((step, i) => {
						const done = currentIdx > i;
						const active = currentIdx === i;
						// const color =
						// 	done || active ? "var(--prod)" : "var(--dim)";
						return (
							<div
								key={step.key}
								className="flex-1 flex flex-col gap-1"
							>
								<div
									className="h-1 rounded-full transition-all duration-700"
									style={{
										background: done
											? "var(--publish)"
											: active
												? "var(--prod)"
												: "var(--dim)",
									}}
								/>
								<span
									className={`text-xs text-center leading-tight ${active ? "animate-pulse-slow" : ""}`}
									style={{
										color: done
											? "var(--publish)"
											: active
												? "var(--prod)"
												: "var(--muted)",
									}}
								>
									{active
										? `⏳ ${step.label}`
										: done
											? `✓`
											: step.label}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	// Captions
	if (status === "adding_captions")
		return (
			<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-surface border border-border">
				<Spinner color="var(--prod)" />
				<span className="text-xs animate-pulse-slow text-prod">
					Generating captions via Whisper…
				</span>
			</div>
		);

	// YouTube upload
	if (status === "uploading")
		return (
			<div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-surface border border-border">
				<Spinner color="var(--publish)" />
				<span className="text-xs animate-pulse-slow text-publish">
					Uploading to YouTube…
				</span>
			</div>
		);

	return null;
}
