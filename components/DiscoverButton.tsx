"use client";

import { discoverIdeas } from "@/lib/actions/discover";
import { useTransition } from "react";
import { toast } from "sonner";

const DiscoverButton = () => {
	const [isPending, startTransition] = useTransition();

	const handleClick = () =>
		startTransition(async () => {
			const result = await discoverIdeas();
			const msg = result.ok
				? `✓ Found ${result.data.found} ideas, ${result.data.new_ideas} new (${(result.data.duration_ms / 1000).toFixed(1)}s)`
				: `✗ ${result.error}`;

			toast(msg, {
				style: {
					background: result.ok ? "#071a10" : "#1a0707",
					border: `1px solid ${result.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
					borderLeft: `3px solid ${result.ok ? "var(--publish)" : "var(--danger)"}`,
					borderRadius: "0.5rem",
					color: result.ok ? "var(--publish)" : "var(--danger)",
					width: "fit-content",
					padding: "0.625rem 1rem",
					fontFamily: "var(--font-mono)",
				},
				duration: 5000,
			});
		});

	return (
		<button
			onClick={handleClick}
			disabled={isPending}
			className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide border-none cursor-pointer transition-all
        ${isPending ? "animate-pulse-slow cursor-not-allowed bg-dim text-muted" : "hover:opacity-90 bg-danger text-white"}`}
			style={{
				fontFamily: "var(--font-mono)",
			}}
		>
			{isPending ? "⏳ Discovering…" : "⚡ Run Discovery"}
		</button>
	);
};

export default DiscoverButton;
