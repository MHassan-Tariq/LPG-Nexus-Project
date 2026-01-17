import { Suspense } from "react";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse, getMonth } from "date-fns";

import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable, type InventoryEntry } from "@/components/inventory/inventory-table";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryDatePicker } from "@/components/inventory/inventory-date-picker";
import { PageSizeSelect } from "@/components/payments/page-size-select";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 10;

interface InventoryPageProps {
  searchParams: Record<string, string | undefined>;
}

function parseMonthYear(month?: string, year?: string) {
  if (!month || !year) return undefined;
  try {
    // Parse date as first day of the month
    const dateStr = `${year}-${month}-01`;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/inventory");
  
  const tenantFilter = await getTenantFilter();
  
  // Fetch software name from settings (with tenant filter)
  const softwareNameSetting = await prisma.systemSettings.findFirst({
    where: {
      ...tenantFilter,
      key: "softwareName",
    },
  });
  const softwareName = softwareNameSetting?.value || "LPG Nexus";
  const requestedSize = searchParams.pageSize;
  
  // Handle "all" option or numeric page size
  let pageSize: number;
  if (requestedSize === "all") {
    pageSize = 10000; // Large number to show all records
  } else {
    const numericSize = Number(requestedSize) || DEFAULT_PAGE_SIZE;
    const validSizes = PAGE_SIZE_OPTIONS.filter((size): size is number => typeof size === "number");
    pageSize = validSizes.includes(numericSize) ? numericSize : DEFAULT_PAGE_SIZE;
  }

  // Filter by month/year
  const month = searchParams.month;
  const year = searchParams.year;
  
  // Determine filter type
  const shouldFilterByDate = month && month !== "ALL" && year && year !== "ALL";
  const shouldFilterByMonthOnly = month && month !== "ALL" && (!year || year === "ALL");
  const shouldFilterByYearOnly = (!month || month === "ALL") && year && year !== "ALL";

  const categoryFilter = searchParams.category ?? "ALL";

  // Build base where clause
  const baseWhere = {
    ...tenantFilter,
    ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
  };

  // Build where clause for Prisma query
  let where: any = baseWhere;
  if (shouldFilterByDate) {
    // Both month and year are specific
    const monthFilter = parseMonthYear(month, year);
    if (monthFilter) {
      where = {
        ...baseWhere,
        entryDate: {
          gte: startOfMonth(monthFilter),
          lte: endOfMonth(monthFilter),
        },
      };
    }
  } else if (shouldFilterByYearOnly) {
    // Only year is specific (All Months)
    const yearNumber = parseInt(year);
    where = {
      ...baseWhere,
      entryDate: {
        gte: startOfYear(new Date(yearNumber, 0, 1)),
        lte: endOfYear(new Date(yearNumber, 11, 31)),
      },
    };
  }

  // Calculate pagination values
  let page = Math.max(Number(searchParams.page) || 1, 1);
  let skip = 0;
  let take = pageSize;
  
  if (requestedSize !== "all") {
    skip = (page - 1) * pageSize;
    take = pageSize;
  } else {
    skip = 0;
    take = 10000; // Large number to get all records
    page = 1;
  }

  // Fetch all entries (we'll filter by month in JS if month-only filtering is needed)
  const allEntries = await prisma.inventoryItem.findMany({
    where,
    orderBy: { entryDate: "desc" },
  });

  // Filter by month only if month is selected with "All Years"
  let filteredEntries = allEntries;
  if (shouldFilterByMonthOnly && month) {
    const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), "08" to 7 (August), etc. (0-indexed)
    filteredEntries = allEntries.filter((entry) => {
      const entryMonth = getMonth(entry.entryDate);
      return entryMonth === selectedMonthNumber;
    });
  }

  // Calculate totals from filtered entries
  const total = filteredEntries.length;
  
  // Apply pagination to filtered entries
  const paginatedEntries = requestedSize === "all" 
    ? filteredEntries 
    : filteredEntries.slice(skip, skip + take);

  const [categories, totalInventory] = await Promise.all([
    prisma.inventoryItem.findMany({ 
      where: tenantFilter,
      distinct: ["category"], 
      select: { category: true }, 
      orderBy: { category: "asc" } 
    }),
    prisma.inventoryItem.aggregate({ where, _sum: { quantity: true } }),
  ]);

  const formattedEntries: InventoryEntry[] = paginatedEntries.map((entry) => ({
    id: entry.id,
    cylinderType: entry.cylinderType,
    category: entry.category,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    vendor: entry.vendor,
    receivedBy: entry.receivedBy,
    description: entry.description,
    verified: entry.verified,
    entryDate: entry.entryDate.toISOString(),
  }));

  let totalPages = 1;
  
  if (requestedSize !== "all") {
    totalPages = Math.max(Math.ceil(total / pageSize), 1);
    if (page > totalPages && totalPages > 0) {
      page = totalPages;
    }
  }
  
  const totalQuantity = totalInventory._sum.quantity ?? 0;
  const categoryOptions = categories.map((item) => item.category);

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between rounded-[24px] border border-transparent px-1">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Inventory Management</h1>
              <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
            </div>
            <div className="w-full max-w-[240px]">
              <Suspense fallback={<div className="h-12 w-full rounded-[18px] border-[#dde3f0] bg-white" />}>
                <InventoryDatePicker />
              </Suspense>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[minmax(340px,0.75fr)_minmax(0,1.25fr)]">
            <InventoryForm />
            <div className="rounded-[32px] border border-[#e5eaf4] bg-white px-5 py-5 shadow-sm lg:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f3fb] pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Inventory List</h3>
                  <p className="text-sm text-slate-500">Total Inventory: {totalQuantity}</p>
                </div>
                <Suspense fallback={<div className="h-11 w-48 rounded-[18px] border-[#dde3f0] bg-white" />}>
                  <InventoryFilters
                    categories={categoryOptions}
                    selectedCategory={categoryFilter}
                  />
                </Suspense>
              </div>

              <div className="mt-4">
                <InventoryTable entries={formattedEntries} />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Suspense fallback={<div className="h-10 min-w-[84px] rounded-full border border-[#dfe4f4] bg-white" />}>
                    <PaginationInfo currentPage={page} totalPages={totalPages} pageSize={requestedSize === "all" ? "all" : pageSize} className="whitespace-nowrap" />
                  </Suspense>
                  <Suspense fallback={<div className="h-10 min-w-[84px] rounded-full border border-[#dfe4f4] bg-white" />}>
                    <PageSizeSelect 
                      value={requestedSize === "all" ? "all" : pageSize} 
                      options={PAGE_SIZE_OPTIONS} 
                      searchParams={searchParams}
                    />
                  </Suspense>
                </div>
                <Suspense fallback={<div className="h-9 w-[200px]" />}>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={requestedSize === "all" ? "all" : pageSize}
                    previousHref={page > 1 ? createPaginationHref(searchParams, page - 1) : undefined}
                    nextHref={page < totalPages ? createPaginationHref(searchParams, page + 1) : undefined}
                  />
                </Suspense>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function createPaginationHref(params: Record<string, string | undefined>, nextPage: number) {
  const next = new URLSearchParams(params as any);
  next.set("page", String(nextPage));
  return `/inventory?${next.toString()}`;
}

