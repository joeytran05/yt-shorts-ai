interface Props {
	// ScoreBars Props
	viral: number | null;
	hook: number | null;
	trend: number | null;
	competition: number | null;
	reasoning?: string | null;

	// PerformancePanel Props
	views: number | null;
	likes: number | null;
	comments: number | null;
	fetchedAt: string | null;
	publishedAt: string | null;
}

const PerformancePanel = ({
	// ScoreBars props
	viral,
	hook,
	trend,
	competition,
	reasoning,
	// PerformancePanel props
	views,
	likes,
	comments,
	fetchedAt,
	publishedAt,
}: Props) => {
	const hasData = views != null;

	const engRate =
		views && likes && views > 0 ? ((likes / views) * 100).toFixed(1) : null;

	const engPct = views && likes && views > 0 ? (likes / views) * 100 : 0;
	// Cap bar at 10% (excellent territory for Shorts)
	const engBarWidth = Math.min((engPct / 10) * 100, 100);

	const engColor =
		engPct >= 8
			? "var(--publish)"
			: engPct >= 5
				? "#34d399"
				: engPct >= 3
					? "var(--review)"
					: "var(--danger)";

	const perfTag = hasData ? getPerformanceTag(views!) : null;

	const age = publishedAt ? relativeTime(new Date(publishedAt)) : null;

	const lastFetched = fetchedAt ? relativeTime(new Date(fetchedAt)) : null;

	return (
		<div>
			{/* Scores section */}
			<div>
				<p className="text-xs tracking-widest mb-2.5 text-muted">
					AI SCORES
				</p>
				<Bar label="VIRAL" value={viral} color="var(--publish)" />
				<Bar label="HOOK" value={hook} color="var(--score)" />
				<Bar label="TREND" value={trend} color="var(--script)" />
				<Bar
					label="COMPETITION"
					value={competition}
					color="var(--review)"
				/>

				{reasoning && (
					<div className="mt-3 rounded-lg p-3 bg-surface border-l-2 border-script">
						<p className="text-xs tracking-widest mb-1 text-script">
							AI ANALYSIS
						</p>
						<p className="text-xs leading-relaxed text-muted-fg">
							{reasoning}
						</p>
					</div>
				)}
			</div>

			{/* Performance section */}
			<div className="flex items-center justify-between mb-2.5">
				<p className="text-xs tracking-widest text-muted">
					PERFORMANCE
				</p>
				{perfTag && (
					<span
						className="text-xs font-semibold"
						style={{ color: perfTag.color }}
					>
						{perfTag.label}
					</span>
				)}
			</div>

			{!hasData ? (
				<p className="text-xs text-muted italic mt-4">
					No metrics yet —{" "}
					{publishedAt
						? "click Refresh Metrics below to fetch metrics from YouTube"
						: "not published"}
				</p>
			) : (
				<>
					{/* Stat row */}
					<div className="grid grid-cols-3 gap-2 mb-3">
						<Stat
							label="VIEWS"
							value={fmt(views!)}
							color="var(--publish)"
						/>
						<Stat
							label="LIKES"
							value={likes != null ? fmt(likes) : "–"}
							color="var(--score)"
						/>
						<Stat
							label="COMMENTS"
							value={comments != null ? fmt(comments) : "–"}
							color="var(--script)"
						/>
					</div>

					{/* Engagement bar */}
					<div className="mb-3">
						<div className="flex justify-between mb-1">
							<span className="text-xs tracking-widest text-muted">
								ENGAGEMENT
							</span>
							<span
								className="text-xs font-semibold"
								style={{ color: engColor }}
							>
								{engRate != null ? `${engRate}%` : "–"}
							</span>
						</div>
						<div className="score-track">
							<div
								className="score-fill"
								style={{
									width: `${engBarWidth}%`,
									background: engColor,
								}}
							/>
						</div>
					</div>

					{/* Footer */}
					<div className="flex justify-between text-xs text-muted mt-1">
						{age && <span>Published {age}</span>}
						{lastFetched && <span>Updated {lastFetched}</span>}
					</div>
				</>
			)}
		</div>
	);
};

const Bar = ({
	label,
	value,
	color,
}: {
	label: string;
	value: number | null;
	color: string;
}) => {
	return (
		<div className="mb-2">
			<div className="flex justify-between mb-1">
				<span className="text-xs tracking-widest text-muted">
					{label}
				</span>
				<span className="text-xs font-semibold" style={{ color }}>
					{value ?? "–"}
				</span>
			</div>
			<div className="score-track">
				<div
					className="score-fill"
					style={{ width: `${value ?? 0}%`, background: color }}
				/>
			</div>
		</div>
	);
};

function Stat({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color: string;
}) {
	return (
		<div
			className="rounded-lg p-2 text-center"
			style={{ background: `${color}0f`, border: `1px solid ${color}22` }}
		>
			<p className="text-xs tracking-widest text-muted mb-0.5">{label}</p>
			<p className="text-sm font-semibold" style={{ color }}>
				{value}
			</p>
		</div>
	);
}

export function getPerformanceTag(views: number): {
	label: string;
	color: string;
} {
	if (views >= 10_000) return { label: "🚀 viral", color: "var(--publish)" };
	if (views >= 1_000) return { label: "📈 growing", color: "#34d399" };
	if (views >= 200) return { label: "😐 average", color: "var(--muted-fg)" };
	if (views >= 50) return { label: "⚠ low", color: "var(--review)" };
	return { label: "💀 dead", color: "var(--danger)" };
}

function fmt(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}

function relativeTime(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const mins = Math.floor(diffMs / 60_000);
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	return `${days}d ago`;
}

export default PerformancePanel;
