import Link from "next/link";
import { Lock } from "lucide-react";

interface Props {
	/** Feature name shown in the lock overlay */
	feature: string;
	/** Minimum plan required */
	requiredPlan?: "creator" | "pro";
	children: React.ReactNode;
}

/**
 * Wraps a settings section with a lock overlay when the user doesn't have access.
 * Pass `locked={false}` (i.e. don't render this component) when the user has access.
 */
export function FeatureLock({ feature, requiredPlan = "creator", children }: Props) {
	const planLabel = requiredPlan === "pro" ? "Pro" : "Creator";
	const planColor =
		requiredPlan === "pro"
			? "text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10"
			: "text-[#c4b5fd] border-[#a78bfa]/40 bg-[#a78bfa]/10";

	return (
		<div className="relative">
			{/* Blurred content */}
			<div className="pointer-events-none select-none opacity-40 blur-[2px]">
				{children}
			</div>

			{/* Lock overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[#08080f]/60 backdrop-blur-[1px]">
				<div
					className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 ${planColor}`}
				>
					<Lock size={12} />
					<span className="text-xs font-bold tracking-wide">
						{planLabel} feature
					</span>
				</div>
				<p className="text-xs text-muted text-center max-w-[200px]">
					{feature} is available on the{" "}
					<strong className="text-text">{planLabel}</strong> plan and above.
				</p>
				<Link
					href="/settings#billing"
					className="text-xs font-bold text-danger hover:text-danger/80 underline transition-colors"
				>
					Upgrade →
				</Link>
			</div>
		</div>
	);
}
