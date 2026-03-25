import { auth } from "@clerk/nextjs/server";
import { getUser } from "@/lib/supabase";

const COLORS: Record<string, string> = {
	free: "text-muted border-border",
	creator: "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10",
	pro: "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10",
};

const LABELS: Record<string, string> = {
	free: "TRY FREE",
	creator: "CREATOR",
	pro: "PRO",
};

export async function PlanBadge() {
	const { userId } = await auth();
	if (!userId) return null;

	const user = await getUser(userId);
	const slug = user?.plan ?? "free";

	return (
		<span
			className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest ${COLORS[slug] ?? COLORS.free}`}
		>
			{LABELS[slug] ?? slug.toUpperCase()}
		</span>
	);
}
