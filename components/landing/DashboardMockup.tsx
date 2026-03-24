"use client";

import { useEffect, useState } from "react";

const PHASES = ["discover", "script", "produce"] as const;
type Phase = (typeof PHASES)[number];

const IDEAS = [
	{ title: "5 Habits That Changed My Life", score: 91, trend: 87 },
	{ title: "Morning Routine of Top 1% Earners", score: 88, trend: 94 },
	{ title: "Why 99% Fail at This (And How to Win)", score: 83, trend: 79 },
];

const SCORE_COLOR = "#3d9eff";
const SCRIPT_COLOR = "#a855f7";
const PROD_COLOR = "#f97316";

function ScoreBar({ value, color }: { value: number; color: string }) {
	return (
		<div className="flex items-center gap-2">
			<div className="h-1 flex-1 rounded-full bg-[#1c1c30]">
				<div
					className="h-1 rounded-full transition-all duration-700"
					style={{ width: `${value}%`, background: color }}
				/>
			</div>
			<span
				className="text-[10px] font-bold tabular-nums w-6 text-right"
				style={{ color, fontFamily: "var(--font-mono)" }}
			>
				{value}
			</span>
		</div>
	);
}

function IdeaCard({
	idea,
	phase,
	index,
}: {
	idea: (typeof IDEAS)[0];
	phase: Phase;
	index: number;
}) {
	const delay = index * 120;
	return (
		<div
			className="rounded-lg border border-[#1c1c30] bg-[#0d0d18] px-3 py-2.5 transition-all duration-500"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="flex items-start justify-between gap-2 mb-2">
				<p className="text-[11px] text-[#dde0f0] leading-snug font-medium line-clamp-1 flex-1">
					{idea.title}
				</p>
				{phase === "discover" && (
					<span
						className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
						style={{
							background: `${SCORE_COLOR}20`,
							color: SCORE_COLOR,
							fontFamily: "var(--font-mono)",
						}}
					>
						{idea.score}
					</span>
				)}
				{phase === "script" && (
					<span
						className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
						style={{
							background: `${SCRIPT_COLOR}20`,
							color: SCRIPT_COLOR,
						}}
					>
						Scripted
					</span>
				)}
				{phase === "produce" && (
					<span
						className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
						style={{
							background: `${PROD_COLOR}20`,
							color: PROD_COLOR,
						}}
					>
						Rendering
					</span>
				)}
			</div>

			{phase === "discover" && (
				<div className="space-y-1">
					<ScoreBar value={idea.score} color={SCORE_COLOR} />
					<ScoreBar value={idea.trend} color="#6b7280" />
				</div>
			)}

			{phase === "script" && (
				<p className="text-[9px] text-[#52527a] leading-relaxed line-clamp-2">
					Most people don&apos;t realize this simple trick…
					Here&apos;s what the top 1% do differently every single
					morning.
				</p>
			)}

			{phase === "produce" && (
				<div className="space-y-1.5">
					<div className="flex items-end gap-0.5 h-4">
						{[3, 5, 8, 6, 9, 7, 4, 6, 8, 5, 7, 9, 6, 4].map(
							(h, i) => (
								<div
									key={i}
									className="flex-1 rounded-sm animate-pulse"
									style={{
										height: `${h * 4 + 8}%`,
										background: PROD_COLOR,
										opacity: 0.6 + (i % 3) * 0.15,
										animationDelay: `${i * 80}ms`,
									}}
								/>
							),
						)}
					</div>
					<div className="flex items-center gap-2">
						<div className="h-1 flex-1 rounded-full bg-[#1c1c30]">
							<div
								className="h-1 rounded-full transition-all duration-1000"
								style={{ width: "62%", background: PROD_COLOR }}
							/>
						</div>
						<span
							className="text-[9px] tabular-nums"
							style={{
								color: PROD_COLOR,
								fontFamily: "var(--font-mono)",
							}}
						>
							62%
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

export function DashboardMockup() {
	const [phase, setPhase] = useState<Phase>("discover");
	const [tick, setTick] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setTick((t) => t + 1);
			setPhase((p) => {
				const idx = PHASES.indexOf(p);
				return PHASES[(idx + 1) % PHASES.length];
			});
		}, 3000);
		return () => clearInterval(id);
	}, []);

	const phaseLabel: Record<Phase, string> = {
		discover: "01 Discover",
		script: "02 Script",
		produce: "03 Produce",
	};
	const phaseColor: Record<Phase, string> = {
		discover: SCORE_COLOR,
		script: SCRIPT_COLOR,
		produce: PROD_COLOR,
	};

	return (
		<div className="w-full rounded-2xl border border-[#1c1c30] bg-[#08080f] overflow-hidden shadow-2xl shadow-black/60">
			{/* Fake window chrome */}
			<div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c1c30] bg-[#0d0d18]">
				<div className="w-3 h-3 rounded-full bg-[#ef4444]/60" />
				<div className="w-3 h-3 rounded-full bg-[#eab308]/60" />
				<div className="w-3 h-3 rounded-full bg-[#22c55e]/60" />
				<div className="flex-1 mx-4">
					<div className="h-5 rounded bg-[#1c1c30] w-48 mx-auto flex items-center justify-center">
						<span
							className="text-[9px] text-[#52527a]"
							style={{ fontFamily: "var(--font-mono)" }}
						>
							app.shorts.ai/dashboard
						</span>
					</div>
				</div>
			</div>

			{/* Fake app layout */}
			<div className="flex" style={{ height: 260 }}>
				{/* Sidebar */}
				<div className="w-32 border-r border-[#1c1c30] bg-[#0d0d18] p-3 shrink-0">
					<div className="space-y-0.5">
						{[
							{
								id: "discover",
								label: "01 Discover",
								color: SCORE_COLOR,
							},
							{
								id: "script",
								label: "02 Script",
								color: SCRIPT_COLOR,
							},
							{
								id: "produce",
								label: "03 Produce",
								color: PROD_COLOR,
							},
							{
								id: "review",
								label: "04 Review",
								color: "#eab308",
							},
							{
								id: "publish",
								label: "05 Publish",
								color: "#22c55e",
							},
						].map((s) => (
							<div
								key={s.id}
								className="px-2 py-1.5 rounded text-[9px] font-bold transition-all"
								style={{
									color: phase === s.id ? s.color : "#52527a",
									background:
										phase === s.id
											? `${s.color}15`
											: "transparent",
									fontFamily: "var(--font-mono)",
								}}
							>
								{s.label}
							</div>
						))}
					</div>
				</div>

				{/* Main content */}
				<div className="flex-1 p-4 overflow-hidden">
					{/* Stage header */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{ background: phaseColor[phase] }}
							/>
							<span
								className="text-[11px] font-bold"
								style={{
									color: phaseColor[phase],
									fontFamily: "var(--font-mono)",
								}}
							>
								{phaseLabel[phase]}
							</span>
							<span className="text-[9px] text-[#52527a]">
								{IDEAS.length} ideas
							</span>
						</div>
						<div
							className="text-[9px] px-2 py-0.5 rounded-full border"
							style={{
								color: phaseColor[phase],
								borderColor: `${phaseColor[phase]}40`,
								background: `${phaseColor[phase]}10`,
							}}
						>
							{phase === "discover"
								? "⚡ Run Discovery"
								: phase === "script"
									? "✍️ Batch Script"
									: "🎬 Produce All"}
						</div>
					</div>

					{/* Idea cards */}
					<div key={tick} className="space-y-2">
						{IDEAS.map((idea, i) => (
							<IdeaCard
								key={idea.title}
								idea={idea}
								phase={phase}
								index={i}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Bottom status bar */}
			<div className="flex items-center justify-between px-4 py-2 border-t border-[#1c1c30] bg-[#0d0d18]">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
						<span
							className="text-[9px] text-[#52527a]"
							style={{ fontFamily: "var(--font-mono)" }}
						>
							Worker active
						</span>
					</div>
				</div>
				<span
					className="text-[9px] text-[#52527a]"
					style={{ fontFamily: "var(--font-mono)" }}
				>
					3 / 30 renders this month
				</span>
			</div>
		</div>
	);
}
