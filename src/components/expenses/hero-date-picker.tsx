"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parse } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HeroDatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Initialize from URL or use "ALL" to show all data
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || "ALL"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    yearParam || "ALL"
  );

  // Update local state when URL params change
  useEffect(() => {
    if (monthParam) {
      setSelectedMonth(monthParam);
    } else {
      setSelectedMonth("ALL");
    }
    if (yearParam) {
      setSelectedYear(yearParam);
    } else {
      setSelectedYear("ALL");
    }
  }, [monthParam, yearParam]);

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    updateURL(month, selectedYear);
  }

  function handleYearChange(year: string) {
    setSelectedYear(year);
    updateURL(selectedMonth, year);
  }

  function updateURL(month: string, year: string) {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle month parameter
    if (month === "ALL" || !month) {
      params.delete("month");
    } else {
      params.set("month", month);
    }
    
    // Handle year parameter
    if (year === "ALL" || !year) {
      params.delete("year");
    } else {
      params.set("year", year);
    }
    
    params.set("page", "1");
    
    router.push(`/expenses?${params.toString()}`);
  }

  // Generate year options (last 10 years to future 2 years)
  const years = Array.from({ length: 13 }, (_, i) => currentYear - 10 + i);
  
  const months = [
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

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-12 flex-1 rounded-[18px] border-[#dde3f0] bg-white px-4 text-sm font-medium text-slate-700">
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200">
          <SelectItem value="ALL" className="text-sm font-semibold">
            All Months
          </SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value} className="text-sm">
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="h-12 w-[120px] rounded-[18px] border-[#dde3f0] bg-white px-4 text-sm font-medium text-slate-700">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200">
          <SelectItem value="ALL" className="text-sm font-semibold">
            All Years
          </SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)} className="text-sm">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

