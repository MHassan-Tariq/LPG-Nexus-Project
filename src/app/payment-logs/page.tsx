import { startOfMonth, endOfMonth, startOfYear, endOfYear, getMonth, parse } from "date-fns";

import { PaymentLogsTable, type PaymentLogItem } from "@/components/payment-logs/payment-logs-table";
import { PaymentLogsSearch } from "@/components/payment-logs/payment-logs-search";
import { PageSizeSelect } from "@/components/payments/page-size-select";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
import { PaymentLogsFilters } from "@/components/payment-logs/payment-logs-filters";

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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 10;

interface PaymentLogsPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function PaymentLogsPage({ searchParams }: PaymentLogsPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/payment-logs");
  
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
  
  let page = Math.max(Number(searchParams.page) || 1, 1);
  if (requestedSize === "all") {
    page = 1;
  }
  const query = searchParams.q?.trim() ?? "";
  
  // Get month/year filters from URL
  const month = searchParams.month;
  const year = searchParams.year;
  
  // Determine filter type
  const shouldFilterByDate = month && month !== "ALL" && year && year !== "ALL";
  const shouldFilterByMonthOnly = month && month !== "ALL" && (!year || year === "ALL");
  const shouldFilterByYearOnly = (!month || month === "ALL") && year && year !== "ALL";
  
  // Build date filter
  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
  if (shouldFilterByDate) {
    const monthFilter = parseMonthYear(month, year);
    if (monthFilter) {
      dateFilter = {
        gte: startOfMonth(monthFilter),
        lte: endOfMonth(monthFilter),
      };
    }
  } else if (shouldFilterByYearOnly && year) {
    const yearNumber = parseInt(year);
    if (!isNaN(yearNumber)) {
      dateFilter = {
        gte: startOfYear(new Date(yearNumber, 0, 1)),
        lte: endOfYear(new Date(yearNumber, 11, 31)),
      };
    }
  }

  // Build where clause
  const where = {
    ...tenantFilter,
    ...(query
      ? {
          customerName: { contains: query, mode: "insensitive" as const },
        }
      : {}),
    ...(dateFilter ? { performedAt: dateFilter } : {}),
  };

  // Fetch payment logs based on filter type
  let logs;
  let totalLogs;
  
  if (shouldFilterByMonthOnly && month) {
    // Month-only filter: fetch all logs, then filter by month in JS
    const allLogs = await prisma.paymentLog.findMany({
      where: {
        ...tenantFilter,
        ...(query
          ? {
              customerName: { contains: query, mode: "insensitive" as const },
            }
          : {}),
      },
      orderBy: { performedAt: "desc" },
    });
    
    const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), etc.
    const filteredLogs = allLogs.filter((log) => {
      if (!log.performedAt) return false;
      return getMonth(new Date(log.performedAt)) === selectedMonthNumber;
    });
    
    // Calculate total before pagination
    totalLogs = filteredLogs.length;
    
    // Apply pagination to filtered results
    const startIndex = requestedSize === "all" ? 0 : (page - 1) * pageSize;
    const endIndex = requestedSize === "all" ? filteredLogs.length : startIndex + pageSize;
    logs = filteredLogs.slice(startIndex, endIndex);
  } else {
    // Date filter or no filter: use Prisma query
    [logs, totalLogs] = await Promise.all([
      prisma.paymentLog.findMany({
        where,
        orderBy: { performedAt: "desc" },
        skip: requestedSize === "all" ? 0 : (page - 1) * pageSize,
        take: requestedSize === "all" ? 10000 : pageSize,
      }),
      prisma.paymentLog.count({ where }),
    ]);
  }

  const formattedLogs: PaymentLogItem[] = logs.map((log) => ({
    id: log.id,
    billId: log.billId,
    customerName: log.customerName,
    customerCode: log.customerCode ?? null,
    billStartDate: log.billStartDate,
    billEndDate: log.billEndDate,
    amount: log.amount,
    performedAt: log.performedAt,
    eventType: log.eventType,
    details: log.details,
  }));

  const totalPages = requestedSize === "all" ? 1 : Math.max(Math.ceil(totalLogs / pageSize), 1);

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between rounded-[24px] border border-transparent px-1">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Payment Logs</h1>
              <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
            </div>
            <PaymentLogsFilters initialMonth={month} initialYear={year} />
          </div>

          <section className="rounded-[32px] border border-[#e5eaf4] bg-white px-4 py-4 shadow-sm lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f3fb] pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Payment Logs</h3>
                <p className="text-sm text-slate-500">
                  View all payment activities including bill generation, updates, deletions, and payment transactions
                </p>
              </div>
              <div className="w-full max-w-sm">
                <PaymentLogsSearch defaultValue={query} />
              </div>
            </div>

            <div className="mt-4">
              <PaymentLogsTable logs={formattedLogs} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <PaginationInfo currentPage={page} totalPages={totalPages} pageSize={requestedSize === "all" ? "all" : pageSize} className="whitespace-nowrap" />
                <PageSizeSelect value={requestedSize === "all" ? "all" : pageSize} options={PAGE_SIZE_OPTIONS} searchParams={searchParams} />
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={requestedSize === "all" ? "all" : pageSize}
                previousHref={page > 1 ? createPaginationHref(searchParams, page - 1) : undefined}
                nextHref={page < totalPages ? createPaginationHref(searchParams, page + 1) : undefined}
              />
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
  return `/payment-logs?${next.toString()}`;
}

