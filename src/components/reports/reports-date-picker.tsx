"use client";

import { useEffect, useState } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportsDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function ReportsDatePicker({ selectedDate, onDateChange }: ReportsDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Check if current date represents "all data" marker
  const isAllDataMarker = selectedDate.getFullYear() === 2000 && selectedDate.getMonth() === 0 && selectedDate.getDate() === 1;
  
  const [selectedMonth, setSelectedMonth] = useState<string>(
    isAllDataMarker ? "ALL" : String(selectedDate.getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    isAllDataMarker ? "ALL" : String(selectedDate.getFullYear())
  );

  // Update local state when selectedDate prop changes
  useEffect(() => {
    const isMarker = selectedDate.getFullYear() === 2000 && selectedDate.getMonth() === 0 && selectedDate.getDate() === 1;
    if (isMarker) {
      setSelectedMonth("ALL");
      setSelectedYear("ALL");
    } else {
      setSelectedMonth(String(selectedDate.getMonth() + 1).padStart(2, "0"));
      setSelectedYear(String(selectedDate.getFullYear()));
    }
  }, [selectedDate]);

  function handleMonthChange(month: string) {
    setSelectedMonth(month);
    updateDate(month, selectedYear);
  }

  function handleYearChange(year: string) {
    setSelectedYear(year);
    updateDate(selectedMonth, year);
  }

  function updateDate(month: string, year: string) {
    // Both "ALL" - show all data (marker date)
    if (month === "ALL" && year === "ALL") {
      const markerDate = new Date(2000, 0, 1);
      onDateChange(markerDate);
    }
    // Month only (year is "ALL") - use marker date with month info
    // The parent component will need to handle month-only filtering
    else if (month !== "ALL" && year === "ALL") {
      // Use current year with selected month for month-only filtering
      const newDate = new Date(currentYear, parseInt(month) - 1, 1);
      onDateChange(newDate);
    }
    // Year only (month is "ALL") - use first month of selected year
    else if (month === "ALL" && year !== "ALL") {
      const newDate = new Date(parseInt(year), 0, 1);
      onDateChange(newDate);
    }
    // Both month and year are specified
    else if (month !== "ALL" && year !== "ALL") {
      const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      onDateChange(newDate);
    }
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

