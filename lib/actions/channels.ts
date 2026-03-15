"use server";

import { revalidatePath } from "next/cache";
import { db, supabase } from "@/lib/supabase";
import type { ActionResult, Channel } from "@/types";

export async function getChannels(): Promise<ActionResult<Channel[]>> {
	try {
		const { data, error } = await supabase
			.from("channels")
			.select("id, name, niche, yt_channel_id, yt_channel_name, yt_channel_thumbnail, created_at")
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

export async function deleteChannel(id: string): Promise<ActionResult> {
	try {
		const { error } = await db.from("channels").delete().eq("id", id);
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

export async function getChannelForNiche(
	niche: string,
): Promise<(Channel & { refresh_token: string }) | null> {
	const { data } = await db
		.from("channels")
		.select("*")
		.eq("niche", niche)
		.single();
	return (data as (Channel & { refresh_token: string })) ?? null;
}
