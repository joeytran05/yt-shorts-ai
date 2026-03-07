interface Props {
	audioUrl?: string | null;
	videoUrl?: string | null;
}

const ProductionPanel = ({ audioUrl, videoUrl }: Props) => {
	if (!audioUrl && !videoUrl) return null;

	return (
		<div className="flex gap-3 flex-wrap mt-4">
			{audioUrl && (
				<div className="flex-1 rounded-lg p-3 bg-surface">
					<p className="text-xs tracking-wide mb-2 text-prod">
						🎤 VOICEOVER
					</p>
					<audio controls src={audioUrl} className="w-full h-8" />
				</div>
			)}
			{videoUrl && (
				<div className="flex-1 rounded-lg p-3 bg-surface">
					<p className="text-[10px] tracking-wide mb-2 text-prod">
						🎬 VIDEO
					</p>
					<video
						controls
						src={videoUrl}
						className="w-full max-h-52 rounded-md bg-black"
					/>
				</div>
			)}
		</div>
	);
};

export default ProductionPanel;
