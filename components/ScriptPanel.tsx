interface Props {
	scriptFull?: string | null;
	durationSec?: number | null;
	musicTrack?: string | null;
}

const ScriptPanel = ({ scriptFull, durationSec, musicTrack }: Props) => {
	if (!scriptFull) return null;

	return (
		<div>
			<p className="text-[9px] tracking-widest mb-2 text-muted">
				SCRIPT {durationSec ? `(~${durationSec}s)` : ""}
			</p>
			<div className="rounded-lg p-3 max-h-48 overflow-y-auto bg-surface">
				<pre className="script-pre">{scriptFull}</pre>
			</div>
			{musicTrack && (
				<p className="text-[10px] mt-2 text-muted">
					🎵 <span className="text-score">{musicTrack}</span>
				</p>
			)}
		</div>
	);
};

export default ScriptPanel;
