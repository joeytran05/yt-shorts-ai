import { GeneralSettings } from "@/components/GeneralSettings";
import { QueryManager } from "@/components/QueryManager";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/supabase";
import Link from "next/link";

export default async function SettingsPage() {
	const settings = await getSettings();

	return (
		<main className="max-w-180 mx-auto px-6 py-10">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-black text-text">
						Settings
					</h1>
					<p className="text-sm mt-1 text-muted">
						Configure discovery queries and pipeline options.
					</p>
				</div>
				<Button variant="outline" className="hover:bg-muted">
					<Link
						href="/dashboard"
						className="transition-opacity hover:opacity-75 shrink-0"
					>
						Back
					</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-5">
				<GeneralSettings initial={settings} />
				<QueryManager initial={settings.youtube_queries} />
			</div>
		</main>
	);
}
