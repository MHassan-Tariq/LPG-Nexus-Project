"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { useDebounce } from "@/hooks/use-debounce";
import { MonthYearPicker, monthYearToDateRange, dateToMonthYear } from "@/components/ui/month-year-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterFormValues = {
  query: string;
  status: string;
  month: number | null;
  year: number | null;
};

interface PaymentsFiltersProps {
  initialQuery: string;
  initialStatus: string;
  from?: Date;
  to?: Date;
}

export function PaymentsFilters({ initialQuery, initialStatus, from, to }: PaymentsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Convert initial dates to month/year
  const initialMonthYear = dateToMonthYear(from || to || null);

  const form = useForm<FilterFormValues>({
    defaultValues: {
      query: initialQuery,
      status: initialStatus,
      month: initialMonthYear.month,
      year: initialMonthYear.year,
    },
  });

  const debounced = useDebounce(form.watch(), 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debounced.query) {
      params.set("q", debounced.query);
    } else {
      params.delete("q");
    }

    if (debounced.status && debounced.status !== "ALL") {
      params.set("status", debounced.status);
    } else {
      params.delete("status");
    }

    // Convert month/year to date range
    const { from: dateFrom, to: dateTo, monthOnly } = monthYearToDateRange(debounced.month, debounced.year);
    
    // Handle month/year params for month-only and year-only filtering
    if (debounced.month !== null) {
      params.set("month", String(debounced.month));
    } else {
      params.delete("month");
    }
    
    if (debounced.year !== null) {
      params.set("year", String(debounced.year));
    } else {
      params.delete("year");
    }
    
    // Also set from/to for backward compatibility and year-only filtering
    if (dateFrom && !monthOnly) {
      params.set("from", format(dateFrom, "yyyy-MM-dd"));
    } else {
      params.delete("from");
    }

    if (dateTo && !monthOnly) {
      params.set("to", format(dateTo, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `/payments?${query}` : "/payments", { scroll: false });
    });
  }, [debounced, router, searchParams]);

  return (
    <div className="grid gap-3 rounded-[32px] border border-[#e5eaf4] bg-white px-4 py-4 shadow-sm lg:grid-cols-[1fr_auto_auto] lg:items-center lg:px-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          {...form.register("query")}
          placeholder="Search by customer name or ID..."
          className="h-12 rounded-[999px] border-[#dfe4f4] bg-[#f7f8fe] pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <MonthYearPicker
        month={form.watch("month")}
        year={form.watch("year")}
        onMonthChange={(month) => form.setValue("month", month)}
        onYearChange={(year) => form.setValue("year", year)}
      />
      <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
        <SelectTrigger className="h-12 w-full rounded-[999px] border-[#dfe4f4] bg-[#f7f8fe] px-6 text-sm font-semibold text-slate-700 shadow-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border border-slate-200">
          <SelectItem value="ALL" className="text-sm">
            All
          </SelectItem>
          <SelectItem value="PAID" className="text-sm">
            Paid
          </SelectItem>
          <SelectItem value="PARTIALLY_PAID" className="text-sm">
            Partially Paid
          </SelectItem>
          <SelectItem value="NOT_PAID" className="text-sm">
            Not Paid
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

