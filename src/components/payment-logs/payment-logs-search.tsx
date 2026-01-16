"use client";

import { Search } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { Input } from "@/components/ui/input";

export function PaymentLogsSearch({ defaultValue }: { defaultValue: string }) {
  const { query, setQuery } = useSearch({
    debounceMs: 300,
    paramName: "q",
  });

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search payments..."
        className="h-12 w-full rounded-[20px] border-[#dfe4f4] bg-[#f7f8fe] pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400"
      />
    </div>
  );
}

