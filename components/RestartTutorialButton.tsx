"use client";

import { useState } from "react";
import { resetTutorial } from "@/lib/actions/tutorial";

export function RestartTutorialButton() {
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		setPending(true);
		await resetTutorial();
		// Full page load so the TutorialOverlay re-mounts and reads step='welcome' from DB
		window.location.href = "/dashboard";
	};

	return (
		<button
			onClick={handleClick}
			disabled={pending}
			className="text-sm text-muted hover:text-text border border-border rounded-lg px-4 py-2 transition-colors hover:border-text/30 disabled:opacity-50 cursor-pointer"
		>
			{pending ? "Restarting…" : "↺ Restart tutorial"}
		</button>
	);
}
