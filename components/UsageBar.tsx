"use client";

import Link from "next/link";

interface Props {
	used: number;
	limit: number;
	plan: string;
}

/**
 * Compact render-usage pill shown in the dashboard header.
 * Only renders when the user is at or above 70% of their monthly limit.
 */
export function UsageBar({ used, limit, plan }: Props) {
	if (plan !== "free" && used / limit < 0.7) return null;

	const pct = Math.min((used / limit) * 100, 100);
	const atLimit = used >= limit;
	const nearLimit = pct >= 80 && !atLimit;

	const barColor = atLimit
		? "var(--danger)"
		: nearLimit
			? "#f59e0b"
			: "var(--publish)";

	const textColor = atLimit
		? "text-danger"
		: nearLimit
			? "text-amber-400"
			: "text-muted";

	return (
		<Link
			href="/settings#billing"
			className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-neutral-800 transition-colors group shrink-0"
		>
			<span
				className={`text-xs font-mono ${textColor} whitespace-nowrap`}
			>
				🎬 {used}/{limit}
			</span>
			<div className="w-16 h-1 rounded-full bg-dim overflow-hidden">
				<div
					className="h-full rounded-full transition-all"
					style={{ width: pct + "%", background: barColor }}
				/>
			</div>
			{atLimit && (
				<span className="text-xs font-bold text-danger group-hover:underline whitespace-nowrap">
					Upgrade →
				</span>
			)}
		</Link>
	);
}
