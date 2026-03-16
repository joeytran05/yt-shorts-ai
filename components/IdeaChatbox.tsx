"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { NICHE_EMOJI } from "@/types";
import type { NicheType } from "@/types";
import { generateIdeaAction, addIdeaFromText } from "@/lib/actions/manual-idea";

const NICHES = Object.keys(NICHE_EMOJI) as NicheType[];

interface GeneratedIdea {
	title: string;
	hook: string;
	description: string;
	tags: string[];
	niche: NicheType;
}

interface Props {
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
}

const IdeaChatbox = ({ onSuccess, onError }: Props) => {
	const [prompt, setPrompt] = useState("");
	const [niche, setNiche] = useState<NicheType>("other");
	const [preview, setPreview] = useState<GeneratedIdea | null>(null);
	const [isGenerating, startGenerate] = useTransition();
	const [isAdding, startAdd] = useTransition();

	const handleGenerate = () => {
		if (!prompt.trim()) return;
		startGenerate(async () => {
			const result = await generateIdeaAction(prompt, niche);
			if (!result.ok) {
				onError(result.error ?? "Generation failed");
				return;
			}
			setPreview(result.data as GeneratedIdea);
		});
	};

	const handleAdd = () => {
		if (!preview) return;
		startAdd(async () => {
			const result = await addIdeaFromText({
				title: preview.title,
				description: preview.description,
				niche: preview.niche,
				tags: preview.tags,
				hook: preview.hook,
			});
			if (!result.ok) {
				onError(result.error ?? "Failed to add idea");
				return;
			}
			onSuccess("Idea added to Discover ✓");
			setPrompt("");
			setPreview(null);
		});
	};

	const handleRegenerate = () => {
		setPreview(null);
		handleGenerate();
	};

	return (
		<div className="space-y-3">
			{/* Prompt input */}
			<div className="space-y-2">
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
							handleGenerate();
					}}
					placeholder="Describe your video concept… e.g. 'A cat seeing snow for the first time'"
					rows={3}
					className="w-full rounded-lg border border-border bg-surface text-text text-xs px-3 py-2.5 resize-none placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border-active"
				/>
				<div className="flex gap-2">
					<Select
						value={niche}
						onValueChange={(v) => setNiche(v as NicheType)}
					>
						<SelectTrigger className="h-8 text-xs flex-1 hover:bg-gray-800">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-bg border border-border">
							{NICHES.map((n) => (
								<SelectItem
									key={n}
									value={n}
									className="text-xs border-b border-border last:border-0 hover:bg-gray-800"
								>
									{NICHE_EMOJI[n]} {n.replace(/_/g, " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						size="sm"
						disabled={isGenerating || !prompt.trim()}
						className="bg-script text-black hover:bg-script/90 font-semibold shrink-0"
						onClick={handleGenerate}
					>
						{isGenerating ? "⏳ Generating…" : "✨ Generate"}
					</Button>
				</div>
			</div>

			{/* Generated preview card */}
			{preview && (
				<div className="rounded-lg border border-border p-3 space-y-2.5 animate-slide-up bg-card-hover">
					<p className="text-xs tracking-widest text-script">
						AI SUGGESTION — EDIT BEFORE ADDING
					</p>

					<div className="space-y-1.5">
						<label className="text-xs tracking-wider text-muted">
							TITLE
						</label>
						<Input
							value={preview.title}
							onChange={(e) =>
								setPreview(
									(p) => p && { ...p, title: e.target.value },
								)
							}
							className="h-7 text-xs"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs tracking-wider text-muted">
							HOOK (first 3 seconds)
						</label>
						<Input
							value={preview.hook}
							onChange={(e) =>
								setPreview(
									(p) => p && { ...p, hook: e.target.value },
								)
							}
							className="h-7 text-xs text-score"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs tracking-wider text-muted">
							DESCRIPTION
						</label>
						<Input
							value={preview.description}
							onChange={(e) =>
								setPreview(
									(p) =>
										p && {
											...p,
											description: e.target.value,
										},
								)
							}
							className="h-7 text-xs"
						/>
					</div>

					<div className="flex items-center gap-1.5 flex-wrap">
						<span className="text-xs tracking-wider text-muted">
							TAGS:
						</span>
						{preview.tags.map((t, i) => (
							<span
								key={i}
								className="text-xs px-1.5 py-0.5 rounded-full bg-script/18 text-script border border-script/30"
							>
								{t}
							</span>
						))}
					</div>

					<div className="flex gap-2 pt-1 border-t border-border">
						<Button
							size="sm"
							variant="ghost"
							disabled={isGenerating || isAdding}
							className="text-xs text-muted hover:bg-gray-700"
							onClick={handleRegenerate}
						>
							↺ Regenerate
						</Button>
						<Button
							size="sm"
							disabled={isAdding}
							className="bg-publish text-[#071a10] hover:bg-publish/90 font-semibold ml-auto"
							onClick={handleAdd}
						>
							{isAdding ? "⏳ Adding…" : "✅ Add to Pipeline"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};

export default IdeaChatbox;
