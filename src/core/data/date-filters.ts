/**
 * Core Date Filter Utilities
 * 
 * Centralized date filtering logic for month/year filtering across pages.
 * Supports month-only, year-only, and month+year filtering patterns.
 * Wraps existing date filter logic without changing behavior.
 */

import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parse, getMonth } from "date-fns";

/**
 * Parse month and year from URL search params
 * 
 * @param month - Month string (e.g., "01", "12")
 * @param year - Year string (e.g., "2024")
 * @returns Parsed Date object or undefined if invalid
 */
export function parseMonthYear(month?: string, year?: string): Date | undefined {
  if (!month || !year) return undefined;
  try {
    const dateStr = `${year}-${month}-01`;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

/**
 * Determine date filter type from search params
 */
export interface DateFilterType {
  shouldFilterByDate: boolean;
  shouldFilterByMonthOnly: boolean;
  shouldFilterByYearOnly: boolean;
}

/**
 * Analyze date filter parameters
 * 
 * @param month - Month from search params
 * @param year - Year from search params
 * @returns Filter type flags
 */
export function getDateFilterType(month?: string, year?: string): DateFilterType {
  const shouldFilterByDate = !!(month && month !== "ALL" && year && year !== "ALL");
  const shouldFilterByMonthOnly = !!(month && month !== "ALL" && (!year || year === "ALL"));
  const shouldFilterByYearOnly = !!((!month || month === "ALL") && year && year !== "ALL");

  return {
    shouldFilterByDate,
    shouldFilterByMonthOnly,
    shouldFilterByYearOnly,
  };
}

/**
 * Build Prisma date filter for server-side queries
 * 
 * @param month - Month string (e.g., "01")
 * @param year - Year string (e.g., "2024")
 * @param dateField - Field name to filter (e.g., "deliveryDate", "expenseDate")
 * @returns Prisma date filter object or undefined
 */
export function buildDateFilter(
  month?: string,
  year?: string,
  dateField: string = "date"
): { gte?: Date; lte?: Date } | undefined {
  const { shouldFilterByDate, shouldFilterByYearOnly } = getDateFilterType(month, year);

  if (shouldFilterByDate) {
    const monthFilter = parseMonthYear(month, year);
    if (monthFilter) {
      return {
        gte: startOfMonth(monthFilter),
        lte: endOfMonth(monthFilter),
      };
    }
  } else if (shouldFilterByYearOnly && year) {
    const yearNumber = parseInt(year);
    if (!isNaN(yearNumber)) {
      return {
        gte: startOfYear(new Date(yearNumber, 0, 1)),
        lte: endOfYear(new Date(yearNumber, 11, 31)),
      };
    }
  }

  return undefined;
}

/**
 * Filter array by month (client-side filtering for month-only filters)
 * 
 * @param items - Array of items with date fields
 * @param month - Month string (e.g., "01")
 * @param getDate - Function to extract date from item
 * @returns Filtered array
 */
export function filterByMonth<T>(
  items: T[],
  month: string,
  getDate: (item: T) => Date | null | undefined
): T[] {
  if (!month || month === "ALL") return items;

  const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), etc.
  
  return items.filter((item) => {
    const date = getDate(item);
    if (!date) return false;
    return getMonth(date) === selectedMonthNumber;
  });
}

/**
 * Build date filter for bill overlap queries
 * Bill overlaps with date range if: billStartDate <= filterEndDate AND billEndDate >= filterStartDate
 * 
 * @param dateFilter - Standard date filter object
 * @returns Bill overlap filter or undefined
 */
export function buildBillOverlapFilter(
  dateFilter?: { gte?: Date; lte?: Date }
): { billStartDate: { lte?: Date }; billEndDate: { gte?: Date } } | undefined {
  if (!dateFilter || !dateFilter.gte || !dateFilter.lte) return undefined;

  return {
    billStartDate: { lte: dateFilter.lte },
    billEndDate: { gte: dateFilter.gte },
  };
}

/**
 * Get default date range (current month)
 * 
 * @returns Start and end dates for current month
 */
export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  return {
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  };
}

/**
 * Parse date string to Date with start of day
 */
export function parseStartOfDay(dateStr: string): Date {
  return startOfDay(parse(dateStr, "yyyy-MM-dd", new Date()));
}

/**
 * Parse date string to Date with end of day
 */
export function parseEndOfDay(dateStr: string): Date {
  return endOfDay(parse(dateStr, "yyyy-MM-dd", new Date()));
}

