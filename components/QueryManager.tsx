"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { YoutubeQuery } from "@/types";
import { saveQueries } from "@/lib/actions/settings";
import { toastMessage } from "@/lib/utils";

export function QueryManager({ initial }: { initial: YoutubeQuery[] }) {
	const [queries, setQueries] = useState<YoutubeQuery[]>(initial);
	const [newQuery, setNewQuery] = useState("");
	const [isPending, start] = useTransition();

	const toggle = (i: number) =>
		setQueries((prev) =>
			prev.map((q, idx) =>
				idx === i ? { ...q, enabled: !q.enabled } : q,
			),
		);

	const remove = (i: number) =>
		setQueries((prev) => prev.filter((_, idx) => idx !== i));

	const add = () => {
		const q = newQuery.trim();
		if (!q) return;
		if (queries.some((x) => x.query.toLowerCase() === q.toLowerCase())) {
			toastMessage("Query already exists", false);
			return;
		}
		setQueries((prev) => [
			...prev,
			{ query: q, enabled: true, custom: true },
		]);
		setNewQuery("");
	};

	const save = () =>
		start(async () => {
			const result = await saveQueries(queries);
			const msg = result.ok ? "✓ Saved" : `✗ ${result.error}`;
			toastMessage(msg, result.ok);
		});

	const enabledCount = queries.filter((q) => q.enabled).length;

	return (
		<div className="rounded-xl p-5 bg-card border border-border">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-sm font-semibold text-text">
						YouTube Search Queries
					</h2>
					<p className="text-xs mt-0.5 text-muted">
						{enabledCount} of {queries.length} enabled
					</p>
				</div>
				<Button
					size="sm"
					disabled={isPending}
					onClick={save}
					className="bg-publish text-[#071a10] hover:bg-green-600"
				>
					{isPending ? "⏳ Saving…" : "✓ Save"}
				</Button>
			</div>

			{/* Add new query */}
			<div className="flex gap-2 mb-4">
				<Input
					value={newQuery}
					onChange={(e) => setNewQuery(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && add()}
					placeholder="Add custom query…"
					className="h-8 text-xs flex-1"
				/>
				<Button
					size="sm"
					variant="outline"
					onClick={add}
					disabled={!newQuery.trim()}
					className="hover:bg-gray-700"
				>
					<Plus size={13} />
				</Button>
			</div>

			{/* Query list */}
			<div className="flex flex-col gap-1.5">
				{queries.map((q, i) => (
					<div
						key={i}
						className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
						style={{
							background: q.enabled
								? "var(--surface)"
								: "transparent",
							border: `1px solid ${q.enabled ? "var(--border-active)" : "var(--border)"}`,
							opacity: q.enabled ? 1 : 0.45,
						}}
					>
						<button onClick={() => toggle(i)} className="shrink-0">
							{q.enabled ? (
								<ToggleRight
									size={18}
									className="text-publish"
								/>
							) : (
								<ToggleLeft size={18} className="text-muted" />
							)}
						</button>
						<span className="text-xs flex-1 text-text">
							{q.query}
						</span>
						{q.custom && (
							<Badge className="text-xs px-1.5 bg-score-dim text-score border border-score">
								custom
							</Badge>
						)}
						<button
							onClick={() => remove(i)}
							className="shrink-0 hover:opacity-75 transition-opacity"
						>
							<Trash2 size={14} className="text-danger" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
