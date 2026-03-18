"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import { updateIdea } from "@/lib/supabase";
import { approveIdea, retryIdea, restoreIdea } from "./script";
import type { ActionResult } from "@/types";

// ── Batch reject ── sets all to rejected without waiting for anything
export async function batchRejectIdeas(
	ids: string[],
): Promise<ActionResult> {
	let userId: string;
	try {
		({ userId } = await getAuthContext());
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	try {
		await Promise.allSettled(
			ids.map((id) =>
				updateIdea(userId, id, { status: "rejected" }),
			),
		);
		revalidatePath("/dashboard");
		return { ok: true, data: undefined };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// ── Batch approve ── runs AI script gen for each (sequential to respect rate limits)
export async function batchApproveIdeas(
	ids: string[],
): Promise<ActionResult> {
	// Auth is handled inside approveIdea
	const errors: string[] = [];
	for (const id of ids) {
		const result = await approveIdea(id);
		if (!result.ok && result.error) errors.push(result.error);
	}
	revalidatePath("/dashboard");
	if (errors.length === ids.length) {
		return { ok: false, error: errors[0] };
	}
	return { ok: true, data: undefined };
}

// ── Batch restore ── moves rejected ideas back to scored
export async function batchRestoreIdeas(
	ids: string[],
): Promise<ActionResult> {
	// Auth is handled inside restoreIdea
	try {
		await Promise.allSettled(ids.map((id) => restoreIdea(id)));
		revalidatePath("/dashboard");
		return { ok: true, data: undefined };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// ── Batch retry ── retries each failed idea from its last checkpoint
export async function batchRetryIdeas(
	ids: string[],
): Promise<ActionResult> {
	// Auth is handled inside retryIdea
	try {
		await Promise.allSettled(ids.map((id) => retryIdea(id)));
		revalidatePath("/dashboard");
		return { ok: true, data: undefined };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
