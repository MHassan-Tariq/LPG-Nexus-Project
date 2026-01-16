"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryPageSizeSelectProps {
  value: number | string;
  options: (number | string)[];
  searchParams: Record<string, string | undefined>;
}

export function InventoryPageSizeSelect({ value, options, searchParams }: InventoryPageSizeSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(() => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, paramValue]) => {
        if (paramValue) params.set(key, paramValue);
      });
      params.set("pageSize", next);
      params.set("page", "1");
      router.push(`/inventory?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Select value={String(value)} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-10 min-w-[84px] rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-slate-200">
        {options.map((option) => (
          <SelectItem key={option} value={String(option)} className="text-sm">
            {option === "all" ? "All" : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

