import { PricingTable } from "@clerk/nextjs";
import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental";
import type { User } from "@/types";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";
import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";

interface Props {
	user: User;
	rendersUsed: number;
}

const CLERK_PRICING_VARS = {
	colorBackground: "#ffffff",
	colorInputBackground: "#f4f4f8",
	colorText: "#111120",
	colorTextSecondary: "#52527a",
	colorPrimary: "#22c55e",
	colorDanger: "#ef4444",
	borderRadius: "8px",
	fontFamily: "inherit",
	fontSize: "13px",
} as const;

const CLERK_DARK_VARS = {
	colorBackground: "#ffffff",
	colorInputBackground: "#0d0d18",
	colorText: "#ffffff",
	colorTextSecondary: "#a0a0c8",
	colorPrimary: "#22c55e",
	colorDanger: "#ef4444",
	colorNeutral: "#2d2d50",
	borderRadius: "8px",
	fontFamily: "inherit",
	fontSize: "13px",
} as const;

const PLAN_FEATURES: Record<string, { icon: string; label: string }[]> = {
	free: [
		{ icon: "🎬", label: "3 videos / month" },
		{ icon: "📺", label: "1 YouTube channel" },
		{ icon: "🔍", label: "Default search queries" },
		{ icon: "⚡", label: "Standard priority" },
	],
	creator: [
		{ icon: "🎬", label: "30 videos / month" },
		{ icon: "📺", label: "3 YouTube channels" },
		{ icon: "🔍", label: "Custom search queries" },
		{ icon: "🎵", label: "Music library uploads" },
		{ icon: "📅", label: "Scheduled publishing" },
		{ icon: "⚡", label: "Priority rendering" },
	],
	pro: [
		{ icon: "🎬", label: "200 videos / month" },
		{ icon: "📺", label: "10 YouTube channels" },
		{ icon: "🔍", label: "Custom search queries" },
		{ icon: "🎵", label: "Music library uploads" },
		{ icon: "📅", label: "Scheduled publishing" },
		{ icon: "🚀", label: "Highest queue priority" },
	],
};

export async function BillingPanel({ user, rendersUsed }: Props) {
	const client = await clerkClient();
	const subscription = await client.billing.getUserBillingSubscription(
		user.id,
	);

	const slug = (subscription?.subscriptionItems[0]?.plan?.slug ??
		"free") as PlanType;
	const limit = PLAN_LIMITS[slug]?.rendersPerMonth ?? 3;
	const limitLabel = limit === Infinity ? "∞" : String(limit);
	const usagePct = Math.min((rendersUsed / limit) * 100, 100);
	const nearLimit = usagePct >= 80;
	const atLimit = rendersUsed >= limit;
	const rendersLeft = limit - rendersUsed;

	const features = PLAN_FEATURES[slug] ?? PLAN_FEATURES.free;

	const barColor = atLimit
		? "var(--danger)"
		: nearLimit
			? "#f59e0b"
			: "var(--publish)";

	return (
		<div
			id="billing"
			className="rounded-xl border border-border p-5 bg-card"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-sm font-bold text-text">
						Billing &amp; Plan
					</h2>
					<p className="text-xs mt-0.5 text-muted">
						{rendersUsed} / {limitLabel} renders used this month
					</p>
				</div>
				{slug !== "free" && (
					<div className="[&>button]:text-xs [&>button]:px-3 [&>button]:py-1.5 [&>button]:rounded-lg [&>button]:border [&>button]:border-border [&>button]:bg-card [&>button]:text-text [&>button]:cursor-pointer [&>button:hover]:bg-gray-800 [&>button]:transition-colors [&>button]:font-medium">
						<SubscriptionDetailsButton
							subscriptionDetailsProps={{
								appearance: { variables: CLERK_DARK_VARS },
							}}
						>
							Manage Billing
						</SubscriptionDetailsButton>
					</div>
				)}
			</div>

			{/* Usage bar */}
			{limit !== Infinity && (
				<div className="mb-4">
					<div className="h-1.5 rounded-full bg-dim overflow-hidden">
						<div
							className="h-full rounded-full transition-all"
							style={{
								width: usagePct + "%",
								background: barColor,
							}}
						/>
					</div>
					{atLimit && (
						<p className="text-xs text-danger mt-1.5 font-medium">
							Limit reached.{" "}
							<Link
								href="#billing"
								className="underline hover:text-danger/80"
							>
								Upgrade now →
							</Link>
						</p>
					)}
					{nearLimit && !atLimit && (
						<p className="text-xs text-amber-400 mt-1.5">
							{rendersLeft} render{rendersLeft === 1 ? "" : "s"}{" "}
							remaining this month.
						</p>
					)}
				</div>
			)}

			{/* Current plan features */}
			<div className="mb-5 p-3 rounded-lg bg-dim/40 border border-border/60">
				<p className="text-xs font-bold tracking-widest text-muted uppercase mb-2">
					Your plan includes
				</p>
				<div className="grid grid-cols-2 gap-1">
					{features.map((f) => (
						<span
							key={f.label}
							className="text-xs text-text/80 flex items-center gap-1.5"
						>
							<span>{f.icon}</span>
							{f.label}
						</span>
					))}
				</div>
			</div>

			{/* Social proof */}
			<div className="flex items-center gap-3 mb-5 py-3 border-y border-border/50">
				<div className="text-center shrink-0">
					<p className="text-sm font-bold text-text">12,400+</p>
					<p className="text-xs text-muted">Shorts created</p>
				</div>
				<div className="w-px h-8 bg-border shrink-0" />
				<div className="text-center shrink-0">
					<p className="text-sm font-bold text-text">2,100+</p>
					<p className="text-xs text-muted">Creators</p>
				</div>
				<div className="w-px h-8 bg-border shrink-0" />
				<div className="text-center shrink-0">
					<p className="text-sm font-bold text-text">4.8 ★</p>
					<p className="text-xs text-muted">Avg. rating</p>
				</div>
				<div className="flex-1" />
				<p className="text-xs text-muted italic max-w-50 text-right hidden sm:block">
					&ldquo;Cut production time from 4 hours to 10
					minutes.&rdquo;
				</p>
			</div>

			{/* Most popular callout — free users only */}
			{slug === "free" && (
				<div className="mb-4 p-3 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/30 flex items-center gap-3">
					<span className="text-lg">⭐</span>
					<div>
						<p className="text-xs font-bold text-[#c4b5fd]">
							Most creators choose Creator
						</p>
						<p className="text-xs text-muted">
							30 videos/mo · 3 channels · custom queries ·
							scheduling
						</p>
					</div>
				</div>
			)}

			<div className="mt-2">
				{slug === "free" && (
					<p className="text-xs text-muted mb-3">
						You&apos;re trying Shorts.AI free —{" "}
						<strong className="text-text">
							{rendersLeft > 0
								? rendersLeft +
									" free render" +
									(rendersLeft === 1 ? "" : "s") +
									" left"
								: "no free renders left this month"}
						</strong>
						. Upgrade to Creator for 30/mo, custom queries, music
						uploads, and scheduled publishing.
					</p>
				)}
				<PricingTable
					newSubscriptionRedirectUrl="/dashboard"
					appearance={{ variables: CLERK_PRICING_VARS }}
				/>
			</div>
		</div>
	);
}
