import type { User } from "@/types";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";
import Link from "next/link";

interface Props {
	user: User;
	rendersUsed: number;
}

const PLANS: {
	id: PlanType;
	name: string;
	price: string;
	period: string;
	tagline: string;
	popular: boolean;
	checkoutPlan?: string;
	features: { label: string; included: boolean }[];
}[] = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		period: "forever",
		tagline: "Try the pipeline risk-free",
		popular: false,
		features: [
			{ label: "3 Shorts / month", included: true },
			{ label: "1 YouTube channel", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: false },
			{ label: "Music library upload", included: false },
			{ label: "Smart scheduling", included: false },
			{ label: "AI idea chatbox", included: false },
			{ label: "Priority rendering", included: false },
		],
	},
	{
		id: "creator",
		name: "Creator",
		price: "$29",
		period: "/ month",
		tagline: "For serious creators scaling output",
		popular: true,
		checkoutPlan: "creator",
		features: [
			{ label: "30 Shorts / month", included: true },
			{ label: "3 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library upload", included: true },
			{ label: "Smart scheduling", included: true },
			{ label: "AI idea chatbox", included: true },
			{ label: "Priority rendering", included: false },
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$79",
		period: "/ month",
		tagline: "For agencies and power users",
		popular: false,
		checkoutPlan: "pro",
		features: [
			{ label: "200 Shorts / month", included: true },
			{ label: "10 YouTube channels", included: true },
			{ label: "AI script generation", included: true },
			{ label: "Voice + video production", included: true },
			{ label: "Auto captions", included: true },
			{ label: "Custom search queries", included: true },
			{ label: "Music library upload", included: true },
			{ label: "Smart scheduling", included: true },
			{ label: "AI idea chatbox", included: true },
			{ label: "Priority rendering", included: true },
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

export function BillingPanel({ user, rendersUsed }: Props) {
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
							Render limit reached — upgrade to continue.
						</p>
					)}
					{nearLimit && !atLimit && (
						<p className="text-xs text-amber-400 mt-1.5">
							Almost at your limit for this month.
						</p>
					)}
				</div>
			)}

			{/* Plan cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-2">
				{PLANS.map((plan) => {
					const isCurrent = slug === plan.id;
					const isDowngrade =
						(slug === "pro" && plan.id !== "pro") ||
						(slug === "creator" && plan.id === "free");

					return (
						<div
							key={plan.id}
							className={`relative rounded-2xl border p-5 flex flex-col transition-all duration-300 ${
								plan.popular
									? "border-danger bg-card shadow-lg shadow-danger/10 scale-[1.02]"
									: "border-border bg-card hover:border-border/80"
							}`}
						>
							{/* Popular badge */}
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
								slug !== "free" ? (
									<a
										href="/api/billing/checkout?manage=1"
										className="w-full py-2 rounded-xl text-xs font-bold text-center border border-border text-muted hover:bg-dim transition-colors mb-5 block"
									>
										Manage subscription →
									</a>
								) : (
									<div className="w-full py-2 rounded-xl text-xs font-bold text-center border border-border text-muted mb-5 cursor-default">
										Current plan
									</div>
								)
							) : isDowngrade ? (
								<a
									href="/api/billing/checkout?manage=1"
									className="w-full py-2 rounded-xl text-xs font-bold text-center border border-border text-muted/50 hover:bg-dim transition-colors mb-5 block"
								>
									Manage subscription →
								</a>
							) : (
								<a
									href={`/api/billing/checkout?plan=${plan.checkoutPlan}`}
									className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all mb-5 block ${
										plan.popular
											? "bg-danger text-white hover:bg-danger/90 shadow-md shadow-danger/20"
											: "border border-border text-text hover:bg-dim"
									}`}
								>
									Upgrade to {plan.name} →
								</a>
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
