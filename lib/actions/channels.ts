"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getAuthContext } from "@/lib/auth";
import type { ActionResult, Channel } from "@/types";

export async function getChannels(): Promise<ActionResult<Channel[]>> {
	try {
		const { userId } = await getAuthContext();
		const { data, error } = await db
			.from("channels")
			.select(
				"id, user_id, name, yt_channel_id, yt_channel_name, yt_channel_thumbnail, created_at",
			)
			.eq("user_id", userId)
			.order("created_at");
		if (error) throw new Error(error.message);
		return { ok: true, data: (data ?? []) as Channel[] };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

export async function getChannelForUser(
	userId: string,
): Promise<(Channel & { refresh_token: string }) | null> {
	const { data } = await db
		.from("channels")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();
	return (data as (Channel & { refresh_token: string })) ?? null;
}

export async function deleteChannel(id: string): Promise<ActionResult> {
	try {
		const { userId } = await getAuthContext();
		const { error } = await db
			.from("channels")
			.delete()
			.eq("id", id)
			.eq("user_id", userId); // prevent cross-user deletion
		if (error) throw new Error(error.message);
		revalidatePath("/settings");
		return { ok: true, data: undefined };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
