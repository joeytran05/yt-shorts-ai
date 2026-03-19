"use client";

import { discoverIdeas } from "@/lib/actions/discover";
import { toastMessage } from "@/lib/utils";
import { useTransition } from "react";

interface Props {
	/** ISO timestamp until which discovery is on cooldown (null = available now) */
	nextDiscoveryAt?: string | null;
}

function formatTimeRemaining(isoTimestamp: string): string {
	const ms = new Date(isoTimestamp).getTime() - Date.now();
	if (ms <= 0) return "";
	const h = Math.floor(ms / (1000 * 60 * 60));
	const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
	return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const DiscoverButton = ({ nextDiscoveryAt }: Props) => {
	const [isPending, startTransition] = useTransition();

	// Compute cooldown state at render time (static — no live countdown)
	const cooldownLabel =
		nextDiscoveryAt && new Date(nextDiscoveryAt) > new Date()
			? formatTimeRemaining(nextDiscoveryAt)
			: null;

	const isCoolingDown = cooldownLabel !== null;
	const isDisabled = isPending || isCoolingDown;

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
			disabled={isDisabled}
			title={isCoolingDown ? `Next discovery in ${cooldownLabel}` : undefined}
			className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide border-none cursor-pointer transition-all
        ${
			isPending
				? "animate-pulse-slow cursor-not-allowed bg-dim text-muted"
				: isCoolingDown
					? "cursor-not-allowed bg-dim text-muted"
					: "hover:bg-danger/80 bg-danger text-white"
		}`}
			style={{ fontFamily: "var(--font-mono)" }}
		>
			{isPending
				? "⏳ Discovering…"
				: isCoolingDown
					? `⏱ ${cooldownLabel}`
					: "⚡ Run Discovery"}
		</button>
	);
};

export default DiscoverButton;
