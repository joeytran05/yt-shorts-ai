import { NextRequest, NextResponse } from "next/server";
import { EventName, Paddle } from "@paddle/paddle-node-sdk";
import { db } from "@/lib/supabase";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

// Map Paddle price IDs → internal plan slugs
function planFromPriceId(priceId: string): "creator" | "pro" | null {
	if (priceId === process.env.PADDLE_PRICE_ID_CREATOR) return "creator";
	if (priceId === process.env.PADDLE_PRICE_ID_PRO) return "pro";
	return null;
}

export async function POST(req: NextRequest) {
	const rawBody = await req.text();
	const signature = req.headers.get("paddle-signature") ?? "";

	let event;
	try {
		event = await paddle.webhooks.unmarshal(
			rawBody,
			process.env.PADDLE_WEBHOOK_SECRET!,
			signature,
		);
	} catch {
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	switch (event.eventType) {
		case EventName.SubscriptionCreated:
		case EventName.SubscriptionUpdated: {
			const sub = event.data;
			const customerId = sub.customerId;
			const subscriptionId = sub.id;
			const priceId = sub.items?.[0]?.price?.id ?? "";
			const status = sub.status; // active, trialing, past_due, canceled, paused
			const userId = sub.customData?.userId as string | undefined;

			if (!userId) break;

			const plan =
				status === "active" || status === "trialing"
					? (planFromPriceId(priceId) ?? "free")
					: "free";

			await db
				.from("users")
				.update({
					plan,
					paddle_customer_id: customerId,
					paddle_subscription_id: subscriptionId,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId);
			break;
		}

		case EventName.SubscriptionCanceled: {
			const sub = event.data;
			const userId = sub.customData?.userId as string | undefined;
			if (!userId) break;

			await db
				.from("users")
				.update({
					plan: "free",
					paddle_subscription_id: null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId);
			break;
		}

		default:
			break;
	}

	return NextResponse.json({ ok: true });
}
