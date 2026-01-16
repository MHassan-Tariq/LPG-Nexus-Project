"use client";

import { useEffect, useMemo, useState } from "react";
import { CylinderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import { useSearch } from "@/hooks/use-search";
import { apiFetchJson } from "@/lib/api-retry";
import { log } from "@/lib/logger";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

type CustomerLite = {
  id: string;
  name: string;
};

type CylinderRow = {
  id: string;
  serialNumber: string;
  gasType: string;
  capacityLiters: number;
  status: CylinderStatus;
  location: string;
  customer: CustomerLite | null;
  updatedAt: string;
};

interface PaginatedResponse {
  data: CylinderRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CylinderTableProps {
  initialData: PaginatedResponse;
}

const statusTone: Record<CylinderStatus, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700",
  ASSIGNED: "bg-sky-100 text-sky-600",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  RETIRED: "bg-slate-200 text-slate-600",
};

export function CylinderTable({ initialData }: CylinderTableProps) {
  const [payload, setPayload] = useState<PaginatedResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Use hooks for pagination and search
  const { query, resolvedQuery, setQuery, isLoading: isSearchLoading } = useSearch({
    debounceMs: 400,
  });
  const { page, pageSize, setPage, hasNext, hasPrev, totalPages } = usePagination(
    payload.total,
    { initialPageSize: initialData.pageSize }
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    async function fetchData() {
      setIsLoading(true);
      const startTime = Date.now();
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });
        if (resolvedQuery) {
          params.set("q", resolvedQuery);
        }
        
        const json = await apiFetchJson<PaginatedResponse>(
          `/api/cylinders?${params.toString()}`,
          { signal: controller.signal },
          { maxRetries: 2 }
        );
        
        if (!ignore) {
          setPayload(json);
          const duration = Date.now() - startTime;
          log.api("GET", `/api/cylinders`, 200, duration, { page, pageSize, query: resolvedQuery });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          log.error("Failed to fetch cylinders", error, { page, pageSize, query: resolvedQuery });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      ignore = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, resolvedQuery, pageSize]);

  return (
    <Card id="inventory" className="col-span-2">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Cylinder Inventory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search and paginate through real-time stock levels.
          </p>
        </div>
        <div className="relative">
          <Input
            placeholder="Quick search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-64"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && payload.data.length === 0 ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Gas</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payload.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.serialNumber}</TableCell>
                  <TableCell>{item.gasType}</TableCell>
                  <TableCell>{item.capacityLiters}L</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0 text-xs font-medium",
                        statusTone[item.status],
                        "hover:" + statusTone[item.status].split(" ")[0] + " hover:" + statusTone[item.status].split(" ")[1],
                      )}
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.customer?.name ?? "—"}</TableCell>
                  <TableCell>{item.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <PaginationInfo 
              currentPage={page} 
              totalPages={totalPages} 
              pageSize={pageSize} 
              className="whitespace-nowrap" 
            />
            {(isLoading || isSearchLoading) && <span className="text-slate-400">Refreshing...</span>}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            disabled={isLoading || isSearchLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

