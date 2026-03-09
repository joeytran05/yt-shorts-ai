import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// ── Utils ─────────────────────────────────────────────────────────

export const md5 = (s: string) =>
	crypto.createHash("md5").update(s).digest("hex");

export const daysAgo = (d: number) => {
	const dt = new Date();
	dt.setDate(dt.getDate() - d);
	return dt.toISOString();
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function chunk<T>(arr: T[], n: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
	return out;
}

export const toastMessage = (
	msg: string,
	ok: boolean,
	duration: number = 3000,
) => {
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
		duration,
	});
};
