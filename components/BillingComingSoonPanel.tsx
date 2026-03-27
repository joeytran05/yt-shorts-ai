"use client";

import { useState } from "react";
import type { User } from "@/types";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";
import { expressSubscriptionInterest } from "@/lib/actions/billing";

// Temporary drop-in replacement for <BillingPanel> while Paddle verification
// is pending. To re-enable real billing, swap this back to <BillingPanel>
// in app/settings/page.tsx — no other changes needed.

interface Props {
	user: User;
	rendersUsed: number;
	initialNotified?: string[];
}

const PLANS: {
	id: PlanType;
	name: string;
	price: string;
	period: string;
	tagline: string;
	popular: boolean;
	features: { label: string; included: boolean }[];
}[] = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		period: "/ mo",
		tagline: "Try the pipeline",
		popular: false,
		features: [
			{ label: "3 videos / month", included: true },
			{ label: "1 YouTube channel", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Custom search queries", included: false },
			{ label: "Music library uploads", included: false },
			{ label: "Scheduled publishing", included: false },
			{ label: "Priority rendering", included: false },
		],
	},
	{
		id: "creator",
		name: "Creator",
		price: "$29",
		period: "/ mo",
		tagline: "For serious creators",
		popular: true,
		features: [
			{ label: "30 videos / month", included: true },
			{ label: "3 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library uploads", included: true },
			{ label: "Scheduled publishing", included: true },
			{ label: "Priority rendering", included: true },
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$79",
		period: "/ mo",
		tagline: "For agencies & teams",
		popular: false,
		features: [
			{ label: "200 videos / month", included: true },
			{ label: "10 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library uploads", included: true },
			{ label: "Scheduled publishing", included: true },
			{ label: "Highest queue priority", included: true },
		],
	},
];

function Check({ included }: { included: boolean }) {
	return (
		<span className={included ? "text-[#22c55e]" : "text-border"}>
			{included ? "✓" : "—"}
		</span>
	);
}

export function BillingComingSoonPanel({ user, rendersUsed, initialNotified = [] }: Props) {
	const slug = (user.plan ?? "free") as PlanType;
	const limit = PLAN_LIMITS[slug]?.rendersPerMonth ?? 3;
	const limitLabel = limit === Infinity ? "∞" : String(limit);
	const usagePct = Math.min(
		limit === Infinity ? 0 : (rendersUsed / limit) * 100,
		100,
	);
	const nearLimit = usagePct >= 80;
	const atLimit = rendersUsed >= limit && limit !== Infinity;

	const barColor = atLimit
		? "var(--danger)"
		: nearLimit
			? "#f59e0b"
			: "var(--publish)";

	const [notified, setNotified] = useState<Record<string, boolean>>(
		() => Object.fromEntries(initialNotified.map((p) => [p, true])),
	);
	const [pending, setPending] = useState<Record<string, boolean>>({});

	const handleNotify = async (planId: string) => {
		if (notified[planId] || pending[planId]) return;
		setPending((p) => ({ ...p, [planId]: true }));
		await expressSubscriptionInterest(planId);
		setPending((p) => ({ ...p, [planId]: false }));
		setNotified((n) => ({ ...n, [planId]: true }));
	};

	return (
		<div id="billing" className="space-y-4">
			{/* Header */}
			<div>
				<h2 className="text-sm font-bold text-text">Billing &amp; Plan</h2>
				<p className="text-xs mt-0.5 text-muted">
					{rendersUsed} / {limitLabel} renders used this month
				</p>
			</div>

			{/* Usage bar */}
			{limit !== Infinity && (
				<div>
					<div className="h-1.5 rounded-full bg-dim overflow-hidden">
						<div
							className="h-full rounded-full transition-all"
							style={{ width: usagePct + "%", background: barColor }}
						/>
					</div>
					{atLimit && (
						<p className="text-xs text-danger mt-1.5 font-medium">
							Render limit reached — paid plans launching soon.
						</p>
					)}
					{nearLimit && !atLimit && (
						<p className="text-xs text-amber-400 mt-1.5">
							Almost at your limit for this month.
						</p>
					)}
				</div>
			)}

			{/* Coming soon banner */}
			<div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
				<span className="text-amber-400 text-base shrink-0">🚀</span>
				<div>
					<p className="text-xs font-bold text-amber-400">
						Paid plans launching soon
					</p>
					<p className="text-xs text-muted mt-0.5">
						We&apos;re finalising our payment system. Click &ldquo;Notify
						me&rdquo; on any plan and we&apos;ll email you the moment it goes
						live.
					</p>
				</div>
			</div>

			{/* Plan cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-2">
				{PLANS.map((plan) => {
					const isCurrent = slug === plan.id;

					return (
						<div
							key={plan.id}
							className={`relative rounded-2xl border p-5 flex flex-col transition-all duration-300 ${
								plan.popular
									? "border-danger bg-card shadow-lg shadow-danger/10 scale-[1.02]"
									: "border-border bg-card hover:border-border/80"
							}`}
						>
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<span className="px-3 py-1 rounded-full bg-danger text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
										⭐ Most Popular
									</span>
								</div>
							)}

							{/* Plan header */}
							<div className="mb-4">
								<div className="flex items-center justify-between mb-1">
									<h3 className="font-display text-base font-black text-text">
										{plan.name}
									</h3>
									{isCurrent && (
										<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dim text-muted border border-border">
											Current
										</span>
									)}
								</div>
								<p className="text-xs text-muted mb-3">{plan.tagline}</p>
								<div className="flex items-baseline gap-1">
									<span className="font-display text-3xl font-black text-text">
										{plan.price}
									</span>
									<span className="text-xs text-muted">{plan.period}</span>
								</div>
							</div>

							{/* CTA */}
							{isCurrent ? (
								<div className="w-full py-2 rounded-xl text-xs font-bold text-center border border-border text-muted mb-5 cursor-default">
									Current plan
								</div>
							) : (
								<button
									onClick={() => handleNotify(plan.id)}
									disabled={pending[plan.id]}
									className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all mb-5 ${
										notified[plan.id]
											? "border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] cursor-default"
											: plan.popular
												? "bg-danger text-white hover:bg-danger/90 shadow-md shadow-danger/20"
												: "border border-border text-text hover:bg-dim"
									}`}
								>
									{notified[plan.id]
										? "✓ We'll notify you"
										: pending[plan.id]
											? "Saving…"
											: "Notify me when available"}
								</button>
							)}

							{/* Feature list */}
							<ul className="space-y-2">
								{plan.features.map((f, i) => (
									<li key={i} className="flex items-center gap-2 text-xs">
										<Check included={f.included} />
										<span
											className={f.included ? "text-text/80" : "text-muted"}
										>
											{f.label}
										</span>
									</li>
								))}
							</ul>
						</div>
					);
				})}
			</div>

			<p className="text-xs text-muted text-center pt-1">
				All plans include unlimited idea storage. Prices in USD. Cancel anytime.
			</p>
		</div>
	);
}
