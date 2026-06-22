import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sentence case — bagian dari AI sering ALL CAPS. */
export function formatPortionLabel(text: string | undefined | null): string {
  if (!text?.trim()) return "";
  const t = text.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
