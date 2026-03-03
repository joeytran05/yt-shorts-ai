const ScoreRing = ({
	value,
	color,
	size = 40,
}: {
	value: number | null;
	color: string;
	size?: number;
}) => {
	const v = value ?? 0;
	const r = (size - 6) / 2;
	const circ = 2 * Math.PI * r;
	const dash = (v / 100) * circ;

	return (
		<div className="flex flex-col items-center gap-0.5 shrink-0">
			<svg width={size} height={size} className="score-ring -rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="var(--dim)"
					strokeWidth={3}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={3}
					strokeDasharray={`${dash} ${circ}`}
					style={{ transition: "stroke-dasharray 0.6s ease" }}
				/>
				<text
					x={size / 2}
					y={size / 2}
					textAnchor="middle"
					dominantBaseline="central"
					fill={color}
					fontSize={size < 38 ? 9 : 12}
					style={{
						transform: `rotate(90deg)`,
						transformOrigin: `${size / 2}px ${size / 2}px`,
					}}
				>
					{value ?? "?"}
				</text>
			</svg>
		</div>
	);
};

export default ScoreRing;
