import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLakh(amount: number): string {
  const lakh = amount / 100000;
  return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
}

/** Standard reducing-balance EMI formula. */
export function computeEmi(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 12 / 100;
  const n = years * 12;
  if (principal <= 0) return 0;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}
