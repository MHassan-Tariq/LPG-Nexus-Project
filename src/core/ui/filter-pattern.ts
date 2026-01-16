/**
 * Core Filter Pattern Utilities
 * 
 * Shared patterns for filter components (month/year dropdowns, etc.).
 * Provides consistent structure without changing UI.
 */

/**
 * Filter option for select dropdowns
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Month filter options (01-12)
 */
export function getMonthOptions(): FilterOption[] {
  return [
    { value: "ALL", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
}

/**
 * Year filter options (current year ± 10 years)
 */
export function getYearOptions(): FilterOption[] {
  const currentYear = new Date().getFullYear();
  const years: FilterOption[] = [{ value: "ALL", label: "All Years" }];

  for (let i = currentYear + 10; i >= currentYear - 10; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }

  return years;
}

/**
 * Filter state for month/year filters
 */
export interface MonthYearFilterState {
  selectedMonth: string;
  selectedYear: string;
}

/**
 * Update URL with filter params
 */
export function updateFilterURL(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const newParams = new URLSearchParams(searchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === "ALL") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
  });

  // Reset to page 1 when filters change
  newParams.set("page", "1");

  return newParams.toString();
}

