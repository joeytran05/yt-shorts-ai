import { auth, clerkClient } from "@clerk/nextjs/server";

const COLORS: Record<string, string> = {
	free: "text-muted border-border",
	pro: "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10",
	business: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10",
};

const LABELS: Record<string, string> = {
	free: "FREE",
	pro: "PRO",
	business: "BIZ",
};

export async function PlanBadge() {
	const { userId } = await auth();
	const client = await clerkClient();
	if (!userId) return null;

	const subscription =
		await client.billing.getUserBillingSubscription(userId);
	const slug = subscription?.subscriptionItems[0]?.plan?.slug || "free";

	return (
		<span
			className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest ${COLORS[slug] ?? COLORS.free}`}
		>
			{LABELS[slug] ?? slug.toUpperCase()}
		</span>
	);
}
