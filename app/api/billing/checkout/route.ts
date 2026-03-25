import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { getUser } from "@/lib/supabase";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const PRICE_IDS: Record<string, string> = {
	creator: process.env.PADDLE_PRICE_ID_CREATOR!,
	pro: process.env.PADDLE_PRICE_ID_PRO!,
};

async function portalRedirect(customerId: string, subscriptionId: string) {
	const portalSession = await paddle.customerPortalSessions.create(
		customerId,
		[subscriptionId],
	);
	return NextResponse.redirect(portalSession.urls.general.overview);
}

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId)
		return NextResponse.redirect(new URL("/sign-in", req.url));

	const manage = req.nextUrl.searchParams.get("manage");
	const plan = req.nextUrl.searchParams.get("plan");
	const priceId = plan ? PRICE_IDS[plan] : null;
	if (!manage && !priceId)
		return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

	const [clerkUser, dbUser] = await Promise.all([
		currentUser(),
		getUser(userId),
	]);

	const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

	// Send to customer portal if they already have a subscription
	if (dbUser?.paddle_customer_id && dbUser?.paddle_subscription_id) {
		return portalRedirect(
			dbUser.paddle_customer_id,
			dbUser.paddle_subscription_id,
		);
	}

	// New checkout — embed userId in customData so the webhook can find the user
	const transaction = await paddle.transactions.create({
		items: [{ priceId: priceId!, quantity: 1 }],
		customData: { userId },
		...(email ? { customer: { email } } : {}),
	});

	const checkoutUrl = `https://buy.paddle.com/checkout/${transaction.id}`;
	return NextResponse.redirect(checkoutUrl);
}
