"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, getYear, getMonth } from "date-fns";

interface MonthYearPickerProps {
  month: number | null; // 0-11 (0 = January, 11 = December) or null for "All Months"
  year: number | null; // year number or null for "All Years"
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number | null) => void;
  className?: string;
}

const months = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

// Generate years: current year ± 5 years
function getYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear + 5; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
}

export function MonthYearPicker({ month, year, onMonthChange, onYearChange, className }: MonthYearPickerProps) {
  const years = getYears();

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Select
        value={month !== null ? String(month) : "all"}
        onValueChange={(value) => {
          onMonthChange(value === "all" ? null : parseInt(value, 10));
        }}
      >
        <SelectTrigger className="h-12 min-w-[140px] rounded-[999px] border-[#dfe4f4] bg-[#f7f8fe] px-5 text-sm font-semibold text-slate-700 shadow-sm">
          <SelectValue placeholder="All Months" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200">
          <SelectItem value="all" className="text-sm">
            All Months
          </SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={String(m.value)} className="text-sm">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year !== null ? String(year) : "all"}
        onValueChange={(value) => {
          onYearChange(value === "all" ? null : parseInt(value, 10));
        }}
      >
        <SelectTrigger className="h-12 min-w-[120px] rounded-[999px] border-[#dfe4f4] bg-[#f7f8fe] px-5 text-sm font-semibold text-slate-700 shadow-sm">
          <SelectValue placeholder="All Years" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200">
          <SelectItem value="all" className="text-sm">
            All Years
          </SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-sm">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Convert month/year to date range
 * - Both month and year: returns start and end of that month
 * - Month only (year is null): returns null (will be filtered in JS)
 * - Year only (month is null): returns start and end of that year
 * - Both null: returns null (no filter)
 */
export function monthYearToDateRange(month: number | null, year: number | null): { from: Date | null; to: Date | null; monthOnly?: boolean } {
  if (month === null && year === null) {
    return { from: null, to: null };
  }

  // Month only (year is null) - will be filtered in JavaScript
  if (month !== null && year === null) {
    return { from: null, to: null, monthOnly: true };
  }

  // Year only (month is null)
  if (month === null && year !== null) {
    return {
      from: startOfYear(new Date(year, 0, 1)),
      to: endOfYear(new Date(year, 11, 31)),
    };
  }

  // Both month and year are specified
  if (month !== null && year !== null) {
    const date = new Date(year, month, 1);
    return {
      from: startOfMonth(date),
      to: endOfMonth(date),
    };
  }

  return { from: null, to: null };
}

/**
 * Convert date to month/year
 */
export function dateToMonthYear(date: Date | null | undefined): { month: number | null; year: number | null } {
  if (!date) {
    return { month: null, year: null };
  }

  return {
    month: getMonth(date),
    year: getYear(date),
  };
}
