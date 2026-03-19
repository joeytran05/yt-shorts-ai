"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PipelineCount, IdeaStatus } from "@/types";
import { STAGE_GROUPS } from "@/constants";

interface Props {
	counts: PipelineCount[];
}

const PipelineNav = ({ counts }: Props) => {
	const router = useRouter();
	const params = useSearchParams();
	const activeStage = params.get("stage") ?? "discover";

	const countFor = (statuses: readonly IdeaStatus[]) =>
		counts
			.filter((c) => statuses.includes(c.status))
			.reduce((s, c) => s + c.total, 0);

	return (
		<Tabs
			value={activeStage}
			onValueChange={(v) =>
				router.push(`/dashboard?stage=${v}`, { scroll: false })
			}
		>
			<TabsList>
				{STAGE_GROUPS.map((sg) => {
					const n = countFor(sg.statuses);
					return (
						<TabsTrigger key={sg.id} value={sg.id}>
							<span
								className="cursor-pointer hover:text-gray-300 transition-colors"
								style={{
									color:
										activeStage === sg.id
											? sg.color
											: undefined,
								}}
							>
								{sg.label}
							</span>
							{n > 0 && (
								<span
									className="flex items-center justify-center rounded-full text-black font-bold w-3.75 h-3.75 text-[9px]"
									style={{
										background: sg.color,
									}}
								>
									{n}
								</span>
							)}
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
};

export default PipelineNav;
