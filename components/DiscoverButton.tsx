"use client";

import { discoverIdeas } from "@/lib/actions/discover";
import { toastMessage } from "@/lib/utils";
import { useTransition } from "react";

const DiscoverButton = () => {
	const [isPending, startTransition] = useTransition();

	const handleClick = () =>
		startTransition(async () => {
			const result = await discoverIdeas();
			const msg = result.ok
				? `✓ Found ${result.data.found} ideas, ${result.data.new_ideas} new (${(result.data.duration_ms / 1000).toFixed(1)}s)`
				: `✗ ${result.error}`;

			toastMessage(msg, result.ok, 10000);
		});

	return (
		<button
			onClick={handleClick}
			disabled={isPending}
			className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide border-none cursor-pointer transition-all
        ${isPending ? "animate-pulse-slow cursor-not-allowed bg-dim text-muted" : "hover:bg-danger/80 bg-danger text-white"}`}
			style={{
				fontFamily: "var(--font-mono)",
			}}
		>
			{isPending ? "⏳ Discovering…" : "⚡ Run Discovery"}
		</button>
	);
};

export default DiscoverButton;
