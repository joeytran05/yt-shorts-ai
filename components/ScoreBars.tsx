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

interface Props {
	viral: number | null;
	hook: number | null;
	trend: number | null;
	competition: number | null;
	reasoning?: string | null;
}

const ScoreBars = ({ viral, hook, trend, competition, reasoning }: Props) => {
	return (
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
	);
};

export default ScoreBars;
