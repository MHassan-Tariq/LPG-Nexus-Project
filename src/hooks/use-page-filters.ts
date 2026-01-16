/**
 * Reusable Page Filters Hook
 * 
 * Centralized month/year filter state management.
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDateFilterType } from "@/core/data/date-filters";

export interface UsePageFiltersOptions {
  onFilterChange?: (month: string, year: string) => void;
}

export interface UsePageFiltersReturn {
  selectedMonth: string;
  selectedYear: string;
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  filterType: ReturnType<typeof getDateFilterType>;
  updateURL: (updates: { month?: string; year?: string }) => void;
}

/**
 * Hook for managing month/year filters with URL sync
 */
export function usePageFilters(options: UsePageFiltersOptions = {}): UsePageFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthFromUrl = searchParams.get("month") || "ALL";
  const yearFromUrl = searchParams.get("year") || "ALL";

  const [selectedMonth, setSelectedMonth] = useState(monthFromUrl);
  const [selectedYear, setSelectedYear] = useState(yearFromUrl);

  // Sync with URL params
  useEffect(() => {
    const urlMonth = searchParams.get("month") || "ALL";
    const urlYear = searchParams.get("year") || "ALL";
    
    if (urlMonth !== selectedMonth) setSelectedMonth(urlMonth);
    if (urlYear !== selectedYear) setSelectedYear(urlYear);
  }, [searchParams, selectedMonth, selectedYear]);

  const updateURL = (updates: { month?: string; year?: string }) => {
    const params = new URLSearchParams(searchParams);
    
    if (updates.month !== undefined) {
      if (updates.month === "ALL") {
        params.delete("month");
      } else {
        params.set("month", updates.month);
      }
    }
    
    if (updates.year !== undefined) {
      if (updates.year === "ALL") {
        params.delete("year");
      } else {
        params.set("year", updates.year);
      }
    }

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`?${params.toString()}`, { scroll: false });
    
    const finalMonth = updates.month !== undefined ? updates.month : selectedMonth;
    const finalYear = updates.year !== undefined ? updates.year : selectedYear;
    options.onFilterChange?.(finalMonth, finalYear);
  };

  const setMonth = (month: string) => {
    setSelectedMonth(month);
    updateURL({ month });
  };

  const setYear = (year: string) => {
    setSelectedYear(year);
    updateURL({ year });
  };

  const filterType = getDateFilterType(selectedMonth, selectedYear);

  return {
    selectedMonth,
    selectedYear,
    setMonth,
    setYear,
    filterType,
    updateURL,
  };
}

