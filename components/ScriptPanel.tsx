import { Idea } from "@/types";
import { MusicSelector } from "./MusicSelector";

interface Props {
	ideaId: string;
	scriptFull?: string | null;
	durationSec?: number | null;
	musicTrack?: string | null; // GPT-5's suggestion
	currentMusicUrl?: string | null; // saved music_url on idea
	musicLocked: boolean;
	onUpdate: (patch: Partial<Idea>) => void;
	onToast: (msg: string, ok: boolean) => void;
}

export default function ScriptPanel({
	ideaId,
	scriptFull,
	durationSec,
	musicTrack,
	currentMusicUrl,
	musicLocked,
	onUpdate,
	onToast,
}: Props) {
	if (!scriptFull) return null;

	return (
		<div>
			<p className="text-xs tracking-widest mb-2 text-muted">
				SCRIPT {durationSec ? `(~${durationSec}s)` : ""}
			</p>
			<div className="rounded-lg p-3 max-h-48 overflow-y-auto bg-surface">
				<pre className="script-pre">{scriptFull}</pre>
			</div>

			<MusicSelector
				ideaId={ideaId}
				musicSuggestion={musicTrack ?? null}
				currentMusicUrl={currentMusicUrl ?? null}
				locked={musicLocked}
				onUpdate={onUpdate}
				onToast={onToast}
			/>
		</div>
	);
}
