"use client";

import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
	useRef,
} from "react";
import {
	getTutorialState,
	setTutorialStep,
	seedTutorialIdea,
	cleanupTutorialIdea,
} from "@/lib/actions/tutorial";
import { STEPS } from "@/constants";
import { StepDef, StepId } from "@/types";

const SPOTLIGHT_STEPS = STEPS.filter((s) => s.target !== null);
const TOTAL_STEPS = SPOTLIGHT_STEPS.length;

// ── Main component ────────────────────────────────────────────────
export function TutorialOverlay() {
	const [step, setStep] = useState<StepId | "done" | null>(null);
	const [ideaId, setIdeaId] = useState<string | null>(null);
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [isPending, setIsPending] = useState(false);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// ── Load state from DB on mount ──────────────────────────────
	useEffect(() => {
		getTutorialState().then(({ step: saved, ideaId: savedIdeaId }) => {
			setStep(saved === "done" ? "done" : (saved as StepId));
			setIdeaId(savedIdeaId);
		});
	}, []);

	// ── Listen for step-change events from ActionButtons ─────────
	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			setStep(detail.step as StepId);
			if (detail.ideaId) setIdeaId(detail.ideaId);
		};
		window.addEventListener("tutorial-step-changed", handler);
		return () =>
			window.removeEventListener("tutorial-step-changed", handler);
	}, []);

	// ── Spotlight positioning — picks the VISIBLE matching element ──
	const syncRect = useCallback(() => {
		if (!step || step === "done") return;
		const def = STEPS.find((s) => s.id === step);
		if (!def?.target) {
			setRect(null);
			return;
		}
		const els = document.querySelectorAll(def.target);
		let visible: Element | null = null;
		for (const el of els) {
			if (
				el instanceof HTMLElement &&
				el.offsetWidth > 0 &&
				el.offsetHeight > 0
			) {
				visible = el;
				break;
			}
		}
		setRect(visible ? visible.getBoundingClientRect() : null);
	}, [step]);

	useLayoutEffect(() => {
		syncRect();
		window.addEventListener("resize", syncRect);
		window.addEventListener("scroll", syncRect, true);

		// Poll until the target element appears in the DOM
		pollRef.current = setInterval(syncRect, 150);

		// For interactive steps, keep polling (user takes their time)
		const currentDef = STEPS.find((s) => s.id === step);
		const clearPoll = currentDef?.interactive
			? undefined
			: setTimeout(() => {
					if (pollRef.current) clearInterval(pollRef.current);
				}, 4000);

		return () => {
			window.removeEventListener("resize", syncRect);
			window.removeEventListener("scroll", syncRect, true);
			if (pollRef.current) clearInterval(pollRef.current);
			if (clearPoll) clearTimeout(clearPoll);
		};
	}, [step, syncRect]);

	// ── Helpers ──────────────────────────────────────────────────
	const saveStep = (s: StepId | "done") => {
		setStep(s);
		setTutorialStep(s);
	};

	const skip = async () => {
		if (ideaId) await cleanupTutorialIdea(ideaId);
		await setTutorialStep("done");
		window.location.reload();
	};

	const handleCta = async () => {
		if (isPending) return;
		setIsPending(true);
		try {
			switch (step) {
				case "welcome":
					await setTutorialStep("discover");
					window.location.href = "/dashboard?stage=discover";
					break;

				case "discover": {
					const result = await seedTutorialIdea();
					if (result.ok && result.ideaId) {
						// Persist step BEFORE navigating so the overlay reads the
						// right step when the new page mounts.
						await setTutorialStep("idea-found");
						// Hard navigate — avoids the automatic router.refresh()
						// that Next.js fires after every server-action completion,
						// which would race with router.push and strip the expand
						// param from the URL.
						window.location.href = `/dashboard?stage=discover&expand=${result.ideaId}`;
					}
					break;
				}

				// idea-found & script are interactive — no overlay CTA

				case "review":
					saveStep("complete");
					break;

				case "complete": {
					if (ideaId) await cleanupTutorialIdea(ideaId);
					await setTutorialStep("done");
					window.location.href = "/dashboard?stage=discover";
					break;
				}
			}
		} finally {
			setIsPending(false);
		}
	};

	// ── Render ────────────────────────────────────────────────────
	if (step === null || step === "done") return null;

	const def = STEPS.find((s) => s.id === step);
	if (!def) return null;

	const isModal = def.target === null;
	const PADDING = 10;

	return (
		<>
			{/* Dim backdrop — hidden for interactive steps so the spotlight
			     card is fully visible and clickable. The spotlight's own
			     box-shadow dims everything outside the cutout. */}
			{!def.interactive && (
				<div
					className="fixed inset-0 z-9990"
					style={{ background: "rgba(0,0,0,0.72)" }}
				/>
			)}

			{/* Spotlight cutout — always pointer-events-none */}
			{rect && !isModal && (
				<div
					className="fixed z-9991 pointer-events-none"
					style={{
						top: rect.top - PADDING,
						left: rect.left - PADDING,
						width: rect.width + PADDING * 2,
						height: rect.height + PADDING * 2,
						borderRadius: 12,
						boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
						border: def.interactive
							? "1.5px solid rgba(239,68,68,0.4)"
							: "1.5px solid rgba(255,255,255,0.15)",
					}}
				/>
			)}

			{isModal ? (
				<CenteredModal
					def={def}
					isPending={isPending}
					onCta={handleCta}
					onSkip={step !== "complete" ? skip : undefined}
				/>
			) : rect ? (
				<AnchoredTooltip
					rect={rect}
					def={def}
					isPending={isPending}
					onCta={def.ctaLabel ? handleCta : undefined}
					onSkip={skip}
					stepIndex={
						SPOTLIGHT_STEPS.findIndex((s) => s.id === step) + 1
					}
					totalSteps={TOTAL_STEPS}
				/>
			) : (
				// Target element not found yet — loading pill
				<div
					className="fixed bottom-8 left-1/2 -translate-x-1/2 z-9999"
					style={{ pointerEvents: "auto" }}
				>
					<div className="bg-[#0d0d1a] border border-border rounded-xl px-5 py-3 flex items-center gap-3">
						<span className="text-xs text-muted animate-pulse">
							Loading step…
						</span>
						<button
							onClick={skip}
							className="text-[10px] text-muted hover:text-text transition-colors cursor-pointer"
						>
							Skip tour
						</button>
					</div>
				</div>
			)}
		</>
	);
}

// ── Centered modal (welcome / complete) ───────────────────────────
function CenteredModal({
	def,
	isPending,
	onCta,
	onSkip,
}: {
	def: StepDef;
	isPending: boolean;
	onCta: () => void;
	onSkip?: () => void;
}) {
	return (
		<div className="fixed inset-0 z-9999 flex items-center justify-center p-6">
			<div className="bg-[#0d0d1a] border border-border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
				<span className="inline-block text-xs font-bold tracking-widest text-muted border border-border rounded-full px-3 py-1 mb-5 uppercase">
					{def.badge}
				</span>
				<h2 className="font-display text-2xl font-black text-text mb-3">
					{def.title}
				</h2>
				<p className="text-sm text-muted leading-relaxed mb-7">
					{def.body}
				</p>
				<button
					onClick={onCta}
					disabled={isPending}
					className="w-full py-3 rounded-xl bg-danger text-white font-bold text-sm hover:bg-danger/90 transition-colors disabled:opacity-50 cursor-pointer"
				>
					{isPending ? "Loading…" : def.ctaLabel}
				</button>
				{onSkip && (
					<button
						onClick={onSkip}
						className="mt-3 text-xs text-muted hover:text-text transition-colors cursor-pointer block w-full"
					>
						Skip tour
					</button>
				)}
			</div>
		</div>
	);
}

// ── Tooltip anchored near spotlight ──────────────────────────────
function AnchoredTooltip({
	rect,
	def,
	isPending,
	onCta,
	onSkip,
	stepIndex,
	totalSteps,
}: {
	rect: DOMRect;
	def: StepDef;
	isPending: boolean;
	onCta?: () => void;
	onSkip: () => void;
	stepIndex: number;
	totalSteps: number;
}) {
	const PADDING = 10;
	const TIP_W = 300;
	const TIP_H = onCta ? 210 : 185;
	const GAP = 14;

	const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
	const vh = typeof window !== "undefined" ? window.innerHeight : 900;

	const spotBottom = rect.bottom + PADDING;
	const spotTop = rect.top - PADDING;
	const placeBelow = spotBottom + TIP_H + GAP <= vh;
	const top = placeBelow ? spotBottom + GAP : spotTop - TIP_H - GAP;
	const centerX = rect.left + rect.width / 2;
	const left = Math.max(12, Math.min(centerX - TIP_W / 2, vw - TIP_W - 12));

	return (
		<div
			className="fixed z-9999 bg-[#0d0d1a] border border-border rounded-xl p-4 shadow-2xl"
			style={{ top, left, width: TIP_W, pointerEvents: "auto" }}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs font-bold tracking-widest text-muted uppercase">
					{def.badge}
				</span>
				<button
					onClick={onSkip}
					className="text-xs text-muted hover:text-text transition-colors cursor-pointer"
				>
					Skip tour
				</button>
			</div>

			<h3 className="font-display text-sm font-bold text-text mb-1.5">
				{def.title}
			</h3>
			<p className="text-xs text-muted leading-relaxed mb-4">
				{def.body}
			</p>

			{/* Progress dots */}
			<div className="flex items-center gap-1.5 mb-3">
				{Array.from({ length: totalSteps }).map((_, i) => (
					<div
						key={i}
						className="h-1 rounded-full transition-all"
						style={{
							width: i + 1 === stepIndex ? 20 : 12,
							background:
								i + 1 < stepIndex
									? "rgba(239,68,68,0.5)"
									: i + 1 === stepIndex
										? "var(--danger)"
										: "var(--dim, #1e1e2e)",
						}}
					/>
				))}
			</div>

			{onCta ? (
				<button
					onClick={onCta}
					disabled={isPending}
					className="w-full py-2 rounded-lg bg-danger text-white font-bold text-xs hover:bg-danger/90 transition-colors disabled:opacity-50 cursor-pointer"
				>
					{isPending ? "Loading…" : def.ctaLabel}
				</button>
			) : (
				<p className="text-xs text-center text-muted/60 italic">
					👇 Use the button on the card below
				</p>
			)}
		</div>
	);
}
