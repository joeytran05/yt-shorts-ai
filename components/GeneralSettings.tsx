"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/types";
import { saveGeneralSettings } from "@/lib/actions/settings";
import { toastMessage } from "@/lib/utils";

export function GeneralSettings({ initial }: { initial: Settings }) {
	const [minViews, setMinViews] = useState(String(initial.min_views));
	const [perQuery, setPerQuery] = useState(String(initial.per_query));
	const [autoApprove, setAutoApprove] = useState(
		String(initial.auto_approve_above ?? ""),
	);
	const [isPending, start] = useTransition();

	const save = () =>
		start(async () => {
			const result = await saveGeneralSettings({
				min_views: parseInt(minViews) || 100000,
				per_query: Math.max(1, Math.min(3, parseInt(perQuery) || 1)),
				auto_approve_above: autoApprove ? parseInt(autoApprove) : null,
				target_niches: initial.target_niches,
			});
			const msg = result.ok ? "✓ Saved" : `✗ ${result.error}`;
			toastMessage(msg, result.ok, 3000);
		});

	return (
		<div className="rounded-xl p-5 bg-card border border-border">
			<div className="flex items-center justify-between mb-5">
				<h2 className="text-sm font-semibold text-text">
					Discovery Settings
				</h2>
				<Button
					size="sm"
					disabled={isPending}
					onClick={save}
					className="bg-publish text-[#071a10] hover:bg-green-600"
				>
					{isPending ? "⏳ Saving…" : "✓ Save"}
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				<Field
					label="Min Views"
					hint="Only surface videos with at least this many views"
					value={minViews}
					onChange={setMinViews}
					type="number"
				/>
				<Field
					label="Results Per Query"
					hint="Videos fetched per search query (1–3)"
					value={perQuery}
					onChange={setPerQuery}
					type="number"
					min={1}
					max={3}
				/>
				<Field
					label="Auto-approve Viral Score ≥"
					hint="Ideas above this score skip manual review and go straight to scripting. Leave blank to disable."
					value={autoApprove}
					onChange={setAutoApprove}
					type="number"
					placeholder="Disabled"
				/>
			</div>
		</div>
	);
}

function Field({
	label,
	hint,
	value,
	onChange,
	type = "text",
	placeholder,
	min,
	max,
}: {
	label: string;
	hint: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	placeholder?: string;
	min?: number;
	max?: number;
}) {
	return (
		<div>
			<label className="text-xs font-medium block mb-1 text-text">
				{label}
			</label>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				min={min}
				max={max}
				className="h-8 text-xs w-48"
			/>
			<p className="text-xs mt-1 text-muted">{hint}</p>
		</div>
	);
}
