"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Idea, IdeaStatus } from "@/types";
import IdeaCard from "./IdeaCard";
import { toastMessage } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	batchApproveIdeas,
	batchRejectIdeas,
	batchRestoreIdeas,
	batchRetryIdeas,
} from "@/lib/actions/batch";

interface Props {
	initialIdeas: Idea[];
	stageColor: string;
	stageLabel: string;
	emptyIcon: string;
	/** Idea ID to auto-open on mount — set via ?expand=<id> URL param. */
	expandId?: string;
}

const IdeaList = ({
	initialIdeas,
	stageColor,
	stageLabel,
	emptyIcon,
	expandId,
}: Props) => {
	const router = useRouter();
	const [ideas, setIdeas] = useState(initialIdeas);
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isBatchPending, startBatchTransition] = useTransition();

	useEffect(() => {
		setIdeas(initialIdeas);
		setSelectedIds(new Set());
		setSelectionMode(false);
	}, [initialIdeas]);

	const initialIdeaIds = initialIdeas.map((i) => i.id).join(",");

	// ── Supabase Realtime — live status updates ───────────────────
	useEffect(() => {
		const client = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		);

		const ideaIds = initialIdeas.map((i) => i.id);
		if (ideaIds.length === 0) return;

		const channel = client
			.channel("idea-updates")
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "ideas",
					filter: `id=in.(${ideaIds.join(",")})`,
				},
				(payload) => {
					const updated = payload.new as Idea;
					setIdeas((prev) =>
						prev.map((idea) =>
							idea.id === updated.id
								? { ...idea, ...updated }
								: idea,
						),
					);
				},
			)
			.subscribe();

		return () => {
			client.removeChannel(channel);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialIdeaIds]);

	// ── Selection helpers ─────────────────────────────────────────
	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAll = () => setSelectedIds(new Set(ideas.map((i) => i.id)));
	const clearSelection = () => setSelectedIds(new Set());
	const exitSelectionMode = () => {
		setSelectionMode(false);
		setSelectedIds(new Set());
	};
	const allSelected = ideas.length > 0 && selectedIds.size === ideas.length;

	// ── Bulk action runner ────────────────────────────────────────
	const runBatch = (
		fn: () => Promise<{ ok: boolean; error?: string }>,
		successMsg: string,
		navigateTo?: string,
	) => {
		startBatchTransition(async () => {
			const result = await fn();
			if (!result.ok) {
				toastMessage(`✗ ${result.error}`, false, 8000);
			} else {
				toastMessage(successMsg, true, 5000);
				exitSelectionMode();
				if (navigateTo) {
					router.push(`/dashboard?stage=${navigateTo}`, {
						scroll: false,
					});
				} else {
					router.refresh();
				}
			}
		});
	};

	// Derive which bulk actions are available from selected statuses
	const selectedIdeas = ideas.filter((i) => selectedIds.has(i.id));
	const selectedStatuses = new Set<IdeaStatus>(
		selectedIdeas.map((i) => i.status),
	);
	const canApprove =
		selectedStatuses.has("scored") || selectedStatuses.has("discovered");
	const canReject =
		selectedStatuses.has("scored") || selectedStatuses.has("discovered");
	const canRestore = selectedStatuses.has("rejected");
	const canRetry = selectedStatuses.has("failed");
	const ids = [...selectedIds];

	// ── Toast helper ──────────────────────────────────────────────
	const showToast = (msg: string, ok: boolean) => {
		toastMessage(msg, ok, 10000);
	};

	const handleUpdate = (updated: Idea) =>
		setIdeas((prev) =>
			prev.map((i) => (i.id === updated.id ? updated : i)),
		);

	if (ideas.length === 0)
		return (
			<div className="text-center py-16 px-6">
				<p className="text-4xl mb-3">{emptyIcon}</p>
				<p className="text-sm text-muted-fg">
					Nothing in {stageLabel} yet.
				</p>
				{stageLabel.includes("Discover") && (
					<p className="text-xs mt-1.5 text-muted">
						Hit{" "}
						<strong className="text-danger">Run Discovery</strong>{" "}
						to start.
					</p>
				)}
			</div>
		);

	return (
		<>
			{/* ── Toolbar row ── */}
			<div className="flex items-center gap-3 mb-3 px-1">
				{!selectionMode ? (
					<button
						onClick={() => setSelectionMode(true)}
						className="text-xs text-muted hover:text-text transition-colors flex items-center gap-1.5"
					>
						<span className="text-xs border border-border rounded px-1 py-0.5 font-mono">
							☐
						</span>
						Select multiple
					</button>
				) : (
					<>
						<Checkbox
							checked={allSelected}
							onCheckedChange={() =>
								allSelected ? clearSelection() : selectAll()
							}
							className="cursor-pointer"
						/>
						<span className="text-xs text-text select-none">
							{selectedIds.size > 0
								? `${selectedIds.size} of ${ideas.length} selected`
								: `Select all`}
						</span>
						{selectedIds.size > 0 && (
							<button
								onClick={clearSelection}
								className="text-xs text-muted hover:text-text transition-colors"
							>
								× Clear
							</button>
						)}
						<button
							onClick={exitSelectionMode}
							className="ml-auto text-xs text-text hover:text-muted transition-colors"
						>
							Done
						</button>
					</>
				)}
			</div>

			{/* ── Idea cards ── */}
			<div className="flex flex-col gap-2 animate-slide-up">
				{ideas.map((idea) => (
					<IdeaCard
						key={idea.id}
						idea={idea}
						stageColor={stageColor}
						onUpdate={handleUpdate}
						onToast={showToast}
						selected={
							selectionMode ? selectedIds.has(idea.id) : undefined
						}
						onToggleSelect={
							selectionMode
								? () => toggleSelect(idea.id)
								: undefined
						}
						defaultOpen={expandId === idea.id}
					/>
				))}
			</div>

			{/* ── Bulk action bar — floats at bottom when ideas are selected ── */}
			{selectionMode && selectedIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 bg-[#0f0f1a] shadow-[0_8px_32px_rgba(0,0,0,0.7)] animate-slide-up">
					<span className="text-xs font-mono text-white/50 mr-1 shrink-0">
						{selectedIds.size} idea
						{selectedIds.size > 1 ? "s" : ""}
					</span>

					{canApprove && (
						<Button
							size="sm"
							disabled={isBatchPending}
							className="bg-publish text-[#071a10] hover:bg-publish/90 font-bold h-7 text-xs"
							onClick={() =>
								runBatch(
									() => batchApproveIdeas(ids),
									`Scripting ${ids.length} idea${ids.length > 1 ? "s" : ""}…`,
									"script",
								)
							}
						>
							{isBatchPending ? "⏳…" : "✓ Approve & Script"}
						</Button>
					)}

					{canReject && (
						<Button
							size="sm"
							variant="ghost"
							disabled={isBatchPending}
							className="h-7 text-xs text-white/70 hover:bg-white/10 hover:text-white"
							onClick={() =>
								runBatch(
									() => batchRejectIdeas(ids),
									`${ids.length} idea${ids.length > 1 ? "s" : ""} rejected`,
									// "archive",
								)
							}
						>
							✕ Reject
						</Button>
					)}

					{canRestore && (
						<Button
							size="sm"
							disabled={isBatchPending}
							className="bg-score text-black hover:bg-score/90 h-7 text-xs font-bold"
							onClick={() =>
								runBatch(
									() => batchRestoreIdeas(ids),
									`${ids.length} idea${ids.length > 1 ? "s" : ""} restored`,
									"discover",
								)
							}
						>
							↩ Restore
						</Button>
					)}

					{canRetry && (
						<Button
							size="sm"
							disabled={isBatchPending}
							className="bg-danger text-white hover:bg-danger/90 h-7 text-xs font-bold"
							onClick={() =>
								runBatch(
									() => batchRetryIdeas(ids),
									`Retrying ${ids.length} idea${ids.length > 1 ? "s" : ""}…`,
								)
							}
						>
							↺ Retry
						</Button>
					)}

					<div className="w-px h-4 bg-white/15 mx-1" />

					<button
						onClick={exitSelectionMode}
						className="text-xs text-white/40 hover:text-white transition-colors"
					>
						× Cancel
					</button>
				</div>
			)}
		</>
	);
};

export default IdeaList;
