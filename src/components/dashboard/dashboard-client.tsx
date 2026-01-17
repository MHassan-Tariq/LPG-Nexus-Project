"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PaymentLogsTable } from "@/components/dashboard/payment-logs";
import { PaymentEventType } from "@prisma/client";

interface DashboardClientProps {
  initialMetrics: {
    homeExpenses: number;
    otherExpenses: number;
    counterSale: number;
    billReceivables: number;
    profit: number;
    pendingBills: number;
    pendingCustomers: number;
  };
  initialCylinders: {
    total: number;
    inCount: number;
    outCount: number;
    empty: number;
  };
  initialPaymentLogs: Array<{
    id: string;
    name: string;
    billStartDate: string;
    billEndDate: string;
    amount: string;
    performedAt: string;
    eventType: PaymentEventType;
    details: string;
  }>;
}

export function DashboardClient({
  initialMetrics,
  initialCylinders,
  initialPaymentLogs,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || "ALL"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    yearParam || "ALL"
  );
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

  // For now, use initial data. The server will refetch when URL params change
  const metrics = initialMetrics;
  const cylinders = initialCylinders;
  const paymentLogs = initialPaymentLogs;

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
    
    router.push(`/?${params.toString()}`);
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

  return (
    <>
      <div className="flex w-full items-center justify-end gap-2">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
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
      <section id="top">
        <OverviewCards metrics={metrics} cylinders={cylinders} />
      </section>
      <section id="payment-logs">
        <PaymentLogsTable logs={paymentLogs} />
      </section>
    </>
  );
}

