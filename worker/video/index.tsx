import React from "react";
import type { ComponentType } from "react";
import { registerRoot, Composition } from "remotion";
import { ShortsComposition } from "./Composition";
import type { ShortsCompositionProps } from "../../types/scenes";

const DEFAULT_PROPS: ShortsCompositionProps = {
	scenes: [],
	audioUrl: "",
	captions: [],
	totalDurationSec: 30,
	fps: 30,
};

function Root() {
	return (
		<Composition
			id="ShortsVideo"
			component={
				ShortsComposition as ComponentType<Record<string, unknown>>
			}
			durationInFrames={900}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={DEFAULT_PROPS}
		/>
	);
}

registerRoot(Root);
