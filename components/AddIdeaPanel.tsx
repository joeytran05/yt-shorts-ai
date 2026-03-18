"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import IdeaChatbox from "./IdeaChatbox";
import { addIdeaFromUrl } from "@/lib/actions/manual-idea";
import { toastMessage } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/quota";
import type { PlanType } from "@/lib/quota";

interface Props {
	userPlan: PlanType;
}

const AddIdeaPanel = ({ userPlan }: Props) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [url, setUrl] = useState("");
	const [isPending, startTransition] = useTransition();

	const canGenerateFromText = PLAN_LIMITS[userPlan].customQueries;

	const handleUrlAdd = () => {
		if (!url.trim()) return;
		startTransition(async () => {
			const result = await addIdeaFromUrl(url.trim());
			if (!result.ok) {
				toastMessage(`✗ ${result.error}`, false, 8000);
				return;
			}
			toastMessage("Idea added to Discover ✓", true, 5000);
			setUrl("");
			setOpen(false);
			router.refresh();
		});
	};

	const handleSuccess = (msg: string) => {
		toastMessage(msg, true, 5000);
		setOpen(false);
		router.refresh();
	};

	const handleError = (msg: string) => {
		toastMessage(`✗ ${msg}`, false, 8000);
	};

	return (
		<div className="relative">
			{/* Trigger button */}
			<Button
				size="sm"
				variant="outline"
				className="hover:bg-neutral-800 gap-1.5"
				onClick={() => setOpen((o) => !o)}
			>
				{open ? <X size={13} /> : <Plus size={13} />}
				Add Idea Manually
			</Button>

			{/* Drop-down panel */}
			{open && (
				<div className="absolute right-0 top-full mt-2 z-50 w-105 rounded-xl border border-border bg-card shadow-xl animate-slide-up border-l-script border-l-3">
					<div className="px-4 pt-3.5 pb-1">
						<p className="text-xs font-semibold tracking-widest text-script mb-0.5">
							ADD IDEA
						</p>
						<p className="text-xs text-muted">
							Add a specific video or describe your own concept.
						</p>
					</div>

					<Tabs defaultValue="url" className="px-4 pb-4">
						<TabsList className="mb-3 h-8">
							<TabsTrigger
								value="url"
								className="text-xs h-7 px-3"
							>
								🔗 YouTube URL
							</TabsTrigger>
							<TabsTrigger
								value="describe"
								className="text-xs h-7 px-3 gap-1.5"
							>
								✍️ Describe Idea
								{!canGenerateFromText && (
									<Lock size={11} className="text-muted" />
								)}
							</TabsTrigger>
						</TabsList>

						{/* ── Tab A: YouTube URL — available on all plans ── */}
						<TabsContent value="url" className="mt-0 space-y-2">
							<p className="text-xs text-muted">
								Paste any YouTube Shorts URL and we&apos;ll
								fetch the metadata and score it automatically.
							</p>
							<div className="flex gap-2">
								<Input
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleUrlAdd();
									}}
									placeholder="https://youtube.com/shorts/…"
									className="h-8 text-xs flex-1"
								/>
								<Button
									size="sm"
									disabled={isPending || !url.trim()}
									className="bg-score text-black hover:bg-score/90 font-semibold shrink-0"
									onClick={handleUrlAdd}
								>
									{isPending ? "⏳…" : "Add"}
								</Button>
							</div>
							{isPending && (
								<p className="text-xs text-muted animate-pulse">
									Fetching from YouTube + scoring with AI…
								</p>
							)}
						</TabsContent>

						{/* ── Tab B: Describe Idea — Pro+ only ── */}
						<TabsContent value="describe" className="mt-0">
							{canGenerateFromText ? (
								<>
									<p className="text-xs text-muted mb-2">
										Describe your concept, choose a niche,
										and AI will generate a complete scored
										idea you can edit before adding.
									</p>
									<IdeaChatbox
										onSuccess={handleSuccess}
										onError={handleError}
									/>
								</>
							) : (
								<div className="flex flex-col items-center gap-3 py-6 text-center">
									<Lock size={22} className="text-muted" />
									<div>
										<p className="text-xs font-semibold text-text">
											Pro feature
										</p>
										<p className="text-xs text-muted mt-0.5">
											AI text-to-idea generation requires
											a Pro or Business plan.
										</p>
									</div>
									<button
										onClick={() => {
											setOpen(false);
											// Navigate to the settings page and scroll to
											// #billing — works from any page in the app.
											window.location.href = "/settings#billing";
										}}
										className="text-xs text-publish hover:underline"
									>
										Upgrade to Pro →
									</button>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			)}
		</div>
	);
};

export default AddIdeaPanel;
