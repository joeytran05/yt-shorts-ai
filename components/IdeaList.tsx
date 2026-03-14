"use client";

import { useEffect, useState } from "react";
import type { Idea } from "@/types";
import IdeaCard from "./IdeaCard";
import { toastMessage } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

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
					// Only listen to ideas currently visible on this stage
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
