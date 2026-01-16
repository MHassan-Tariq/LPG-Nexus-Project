"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parse, getMonth } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SummaryCards } from "./summary-cards";
import { CylinderUsageTrendChart } from "./cylinder-usage-trend-chart";
import { CylinderTypeDistributionChart } from "./cylinder-type-distribution-chart";
import { RevenueExpensesChart } from "./revenue-expenses-chart";
import { DetailedReportsTable } from "./detailed-reports-table";

interface ReportsClientProps {
  initialMonth?: string;
  initialYear?: string;
  softwareName: string;
}

function parseMonthYear(month?: string, year?: string) {
  if (!month || !year) return undefined;
  try {
    const dateStr = `${year}-${month}-01`;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

export function ReportsClient({ initialMonth, initialYear, softwareName }: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || initialMonth || "ALL"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    yearParam || initialYear || "ALL"
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  // Determine filter type
  const shouldFilterByDate = selectedMonth && selectedMonth !== "ALL" && selectedYear && selectedYear !== "ALL";
  const shouldFilterByMonthOnly = selectedMonth && selectedMonth !== "ALL" && (!selectedYear || selectedYear === "ALL");
  const shouldFilterByYearOnly = (!selectedMonth || selectedMonth === "ALL") && selectedYear && selectedYear !== "ALL";

  // Calculate start and end dates based on filter type
  const { startDate, endDate } = useMemo(() => {
    if (shouldFilterByDate) {
      const monthFilter = parseMonthYear(selectedMonth, selectedYear);
      if (monthFilter) {
        return {
          startDate: startOfMonth(monthFilter),
          endDate: endOfMonth(monthFilter),
        };
      }
    } else if (shouldFilterByYearOnly && selectedYear) {
      const yearNumber = parseInt(selectedYear);
      if (!isNaN(yearNumber)) {
        return {
          startDate: startOfYear(new Date(yearNumber, 0, 1)),
          endDate: endOfYear(new Date(yearNumber, 11, 31)),
        };
      }
    } else if (shouldFilterByMonthOnly && selectedMonth) {
      // For month-only, we'll use a wide range and filter in the API
      // Use current year with selected month
      const currentYearNum = new Date().getFullYear();
      const monthFilter = parseMonthYear(selectedMonth, String(currentYearNum));
      if (monthFilter) {
        return {
          startDate: startOfMonth(monthFilter),
          endDate: endOfMonth(monthFilter),
        };
      }
    }
    
    // Default: current month (show recent data instead of all historical data)
    const date = new Date();
    return {
      startDate: startOfMonth(date),
      endDate: endOfMonth(date),
    };
  }, [selectedMonth, selectedYear, shouldFilterByDate, shouldFilterByMonthOnly, shouldFilterByYearOnly]);

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
    
    router.push(`/reports?${params.toString()}`);
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    startTransition(() => {
      updateURL(month, selectedYear);
    });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    startTransition(() => {
      updateURL(selectedMonth, year);
    });
  };

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

  useEffect(() => {
    fetchReportsData();
  }, [startDate, endDate, shouldFilterByMonthOnly, selectedMonth]);

  async function fetchReportsData() {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set("startDate", format(startDate, "yyyy-MM-dd"));
      params.set("endDate", format(endDate, "yyyy-MM-dd"));
      
      // Add month/year filters for month-only filtering
      if (shouldFilterByMonthOnly && selectedMonth) {
        params.set("month", selectedMonth);
        params.set("filterType", "monthOnly");
      } else if (shouldFilterByYearOnly && selectedYear) {
        params.set("year", selectedYear);
        params.set("filterType", "yearOnly");
      } else if (shouldFilterByDate) {
        params.set("filterType", "monthYear");
      } else {
        params.set("filterType", "all");
      }
      
      const response = await fetch(`/api/reports/data?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reports data");
      }
      const reportsData = await response.json();
      setData(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(downloadFormat: "pdf" | "csv") {
    setDownloading(true);
    try {
      const response = await fetch(
        `/api/reports/download?format=${downloadFormat}&startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`,
      );
      
      if (!response.ok) {
        // Try to get error message from response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || "Failed to download report");
        }
        throw new Error(`Failed to download report: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reports-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download report. Please try again.";
      alert(errorMessage);
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-slate-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={isPending}>
              <SelectTrigger className="h-12 flex-1 rounded-[18px] border-[#dde3f0] bg-white px-4 text-sm font-medium text-slate-700 max-w-[180px]">
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
            
            <Select value={selectedYear} onValueChange={handleYearChange} disabled={isPending}>
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
          <Button
            onClick={() => handleDownload("pdf")}
            disabled={downloading}
            className="gap-2 rounded-xl bg-[#1c5bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Downloading..." : "Download Report"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalRevenue={data.summary.totalRevenue}
        totalExpenses={data.summary.totalExpenses}
        cylindersDelivered={data.summary.cylindersDelivered}
        netProfit={data.summary.netProfit}
        revenueChange={data.summary.revenueChange}
        expensesChange={data.summary.expensesChange}
        cylindersChange={data.summary.cylindersChange}
        profitChange={data.summary.profitChange}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CylinderUsageTrendChart data={data.charts.usageTrend} />
        <CylinderTypeDistributionChart data={data.charts.cylinderDistribution} />
      </div>

      {/* Revenue vs Expenses Chart */}
      <RevenueExpensesChart data={data.charts.revenueExpenses} />

      {/* Detailed Reports Table */}
      <DetailedReportsTable data={data.detailedReports} />
    </div>
  );
}

