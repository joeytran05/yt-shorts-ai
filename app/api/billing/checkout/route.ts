import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { getUser } from "@/lib/supabase";

const PRICE_IDS: Record<string, string | undefined> = {
	creator: process.env.PADDLE_PRICE_ID_CREATOR,
	pro: process.env.PADDLE_PRICE_ID_PRO,
};

export async function GET(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId)
			return NextResponse.redirect(new URL("/sign-in", req.url));

		const manage = req.nextUrl.searchParams.get("manage");
		const plan = req.nextUrl.searchParams.get("plan");
		const priceId = plan ? PRICE_IDS[plan] : null;

		console.log("[checkout] fullUrl:", req.url, "| plan:", plan, "| manage:", manage, "| priceId:", priceId);

		if (!manage && !priceId) {
			console.error("[checkout] Invalid plan or missing PADDLE_PRICE_ID env var. plan:", plan, "priceId:", priceId);
			return NextResponse.json({ error: "Invalid plan or missing price ID env var" }, { status: 400 });
		}

		if (!process.env.PADDLE_API_KEY) {
			console.error("[checkout] PADDLE_API_KEY is not set");
			return NextResponse.json({ error: "Paddle not configured" }, { status: 500 });
		}

		const paddle = new Paddle(process.env.PADDLE_API_KEY);

		const [clerkUser, dbUser] = await Promise.all([
			currentUser(),
			getUser(userId),
		]);

		const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

		// Send to customer portal if they already have a subscription
		if (manage || (dbUser?.paddle_customer_id && dbUser?.paddle_subscription_id)) {
			if (!dbUser?.paddle_customer_id || !dbUser?.paddle_subscription_id) {
				return NextResponse.redirect(new URL("/settings#billing", req.url));
			}
			const portalSession = await paddle.customerPortalSessions.create(
				dbUser.paddle_customer_id,
				[dbUser.paddle_subscription_id],
			);
			return NextResponse.redirect(portalSession.urls.general.overview);
		}

		// New checkout
		const transaction = await paddle.transactions.create({
			items: [{ priceId: priceId!, quantity: 1 }],
			customData: { userId },
			...(email ? { customer: { email } } : {}),
		});

		const isSandbox = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox";
		const checkoutUrl = `https://${isSandbox ? "sandbox-buy" : "buy"}.paddle.com/checkout/${transaction.id}`;
		console.log("[checkout] Redirecting to:", checkoutUrl);
		return NextResponse.redirect(checkoutUrl);

	} catch (err) {
		console.error("[checkout] Error:", err);
		const message = err instanceof Error ? err.message : String(err);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
