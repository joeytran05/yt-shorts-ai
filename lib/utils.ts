import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

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
