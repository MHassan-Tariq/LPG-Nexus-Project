import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets today's date with time set to midnight (00:00:00)
 * This ensures consistent date handling and avoids timezone issues.
 * Use this for form default values instead of `new Date()` to ensure
 * fresh dates are always created.
 */
export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Formats a number with comma separators (e.g., 10000 -> "10,000")
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return value.toLocaleString('en-US');
}

/**
 * Formats currency with commas and prevents line breaks (e.g., Rs 10,000)
 * @param value - The number to format
 * @returns Formatted currency string with commas
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "Rs 0";
  if (value === 0) return "Rs 0";
  // Handle negative numbers
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  return `${sign}Rs ${formatNumber(absValue)}`;
}

/**
 * Parses a formatted number string (with commas) back to a number
 * @param value - The formatted string (e.g., "10,000")
 * @returns The parsed number
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
