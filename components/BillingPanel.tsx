import { PricingTable } from "@clerk/nextjs";
import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental";
import type { User } from "@/types";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";
import { clerkClient } from "@clerk/nextjs/server";

interface Props {
	user: User;
	rendersUsed: number;
}

// Light-mode variables for PricingTable so Clerk's default dark text
// renders legibly against a white surface.
const CLERK_PRICING_VARS = {
	colorBackground: "#ffffff",
	colorInputBackground: "#f4f4f8",
	colorText: "#111120",
	colorTextSecondary: "#52527a",
	colorPrimary: "#22c55e",
	colorDanger: "#ef4444",
	// colorNeutral: "#e0e0f0",
	borderRadius: "8px",
	fontFamily: "inherit",
	fontSize: "13px",
} as const;

// Dark-mode variables for the SubscriptionDetailsButton modal — matches
// the rest of the settings panel.
const CLERK_DARK_VARS = {
	colorBackground: "#111120",
	// colorBackground: "#D4D4E8",
	// colorBackground: "#DADAEC",
	colorInputBackground: "#0d0d18",
	// colorText: "#dde0f0",
	colorText: "#ffffff",
	colorTextSecondary: "#a0a0c8",
	colorPrimary: "#22c55e",
	colorDanger: "#ef4444",
	colorNeutral: "#2d2d50",
	borderRadius: "8px",
	fontFamily: "inherit",
	fontSize: "13px",
} as const;

export async function BillingPanel({ user, rendersUsed }: Props) {
	const client = await clerkClient();
	const subscription = await client.billing.getUserBillingSubscription(
		user.id,
	);

	const slug = (subscription?.subscriptionItems[0]?.plan?.slug ??
		"free") as PlanType;
	const limit = PLAN_LIMITS[slug].rendersPerMonth;
	const limitLabel = limit === Infinity ? "∞" : String(limit);

	return (
		<div
			id="billing"
			className="rounded-xl border border-border p-5 bg-card"
		>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-sm font-bold text-text">
						Billing & Plan
					</h2>
					<p className="text-xs mt-0.5 text-muted">
						{rendersUsed} / {limitLabel} renders used this month
					</p>
				</div>
				{slug !== "free" && (
					/* Wrap so we can target the Clerk-rendered <button> element */
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

			{/* Render usage bar */}
			{limit !== Infinity && (
				<div className="mb-4">
					<div className="h-1.5 rounded-full bg-dim overflow-hidden">
						<div
							className="h-full rounded-full transition-all"
							style={{
								width: `${Math.min((rendersUsed / limit) * 100, 100)}%`,
								background:
									rendersUsed >= limit
										? "var(--danger)"
										: "var(--publish)",
							}}
						/>
					</div>
				</div>
			)}

			<div className="mt-2">
				{slug === "free" && (
					<p className="text-xs text-muted mb-3">
						Upgrade to Pro for 30 renders/month, custom queries,
						music uploads, and scheduled publishing.
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
