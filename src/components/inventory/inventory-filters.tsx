"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryFiltersProps {
  categories: string[];
  selectedCategory: string;
}

export function InventoryFilters({ categories, selectedCategory }: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(next: Record<string, string | undefined>) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.set("page", "1");
      router.replace(`/inventory?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Select
      value={selectedCategory || "ALL"}
      onValueChange={(value) => updateParams({ category: value === "ALL" ? undefined : value })}
      disabled={isPending}
    >
      <SelectTrigger className="h-11 rounded-[18px] border-[#dde3f0] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-slate-200">
        <SelectItem value="ALL" className="text-sm">
          All Categories
        </SelectItem>
        {categories.map((category) => (
          <SelectItem key={category} value={category} className="text-sm">
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

