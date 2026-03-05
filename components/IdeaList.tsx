"use client";

import { useEffect, useState } from "react";
import type { Idea } from "@/types";
import IdeaCard from "./IdeaCard";
import { toast } from "sonner";

interface Props {
	initialIdeas: Idea[];
	stageColor: string;
	stageLabel: string;
	emptyIcon: string;
}

const IdeaList = ({
	initialIdeas,
	stageColor,
	stageLabel,
	emptyIcon,
}: Props) => {
	const [ideas, setIdeas] = useState(initialIdeas);

	useEffect(() => {
		setIdeas(initialIdeas);
	}, [initialIdeas]);

	const showToast = (msg: string, ok: boolean) => {
		toast(msg, {
			style: {
				background: ok ? "#071a10" : "#1a0707",
				border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
				borderLeft: `3px solid ${ok ? "var(--publish)" : "var(--danger)"}`,
				borderRadius: "0.5rem",
				color: ok ? "var(--publish)" : "var(--danger)",
				width: "fit-content",
				padding: "0.625rem 1rem",
				fontFamily: "var(--font-mono)",
			},
			duration: 10000,
		});
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
			<div className="flex flex-col gap-2 animate-slide-up">
				{ideas.map((idea) => (
					<IdeaCard
						key={idea.id}
						idea={idea}
						stageColor={stageColor}
						onUpdate={handleUpdate}
						onToast={showToast}
					/>
				))}
			</div>
		</>
	);
};

export default IdeaList;
