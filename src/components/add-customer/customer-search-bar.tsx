"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/use-search";

interface CustomerSearchBarProps {
  query: string;
  searchParamKey?: string;
  pageParamKey?: string;
  basePath?: string;
  hash?: string;
}

export function CustomerSearchBar({
  query,
  searchParamKey = "q",
  pageParamKey = "page",
  basePath,
  hash,
}: CustomerSearchBarProps) {
  const pathname = usePathname();
  const { query: searchQuery, setQuery, isLoading } = useSearch({
    debounceMs: 250,
    paramName: searchParamKey,
  });

  const targetPath = basePath ?? pathname;

  return (
    <div className="flex w-full items-center gap-3 rounded-[24px] bg-[#f3f5fb] px-4 py-2 text-sm text-slate-600">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={searchQuery}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search customers by name or ID..."
        className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
      />
      {isLoading && <span className="text-xs text-slate-400">Updating…</span>}
    </div>
  );
}

