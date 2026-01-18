import { endOfMonth, parseISO, startOfMonth, startOfYear, endOfYear, getMonth } from "date-fns";

import { PaymentRecordsTable, type PaymentRecordRow } from "@/components/payments/payment-table";
import { PaymentsFilters } from "@/components/payments/payments-filters";
import { PaymentSummaryCards } from "@/components/payments/summary-cards";
import { PaymentActionsBar } from "@/components/payments/payment-actions";
import { PageSizeSelect } from "@/components/payments/page-size-select";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 10;

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseStatus(value?: string) {
  if (!value) return "ALL";
  if (["PAID", "PARTIALLY_PAID", "NOT_PAID"].includes(value)) {
    return value;
  }
  return "ALL";
}

interface PaymentsPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/payments");
  
  // Fetch software name from settings with error handling (with tenant filter)
  let softwareName = "LPG Nexus";
  try {
    const tenantFilter = await getTenantFilter();
    const softwareNameSetting = await prisma.systemSettings.findFirst({
      where: {
        ...tenantFilter,
        key: "softwareName",
      },
    });
    softwareName = softwareNameSetting?.value || "LPG Nexus";
  } catch (error: any) {
    if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
      throw error;
    }
    console.error("Error fetching software name:", error);
    // Use default value if query fails
    softwareName = "LPG Nexus";
  }
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

  // Parse date filters
  const from = parseDate(searchParams.from) ?? undefined;
  const to = parseDate(searchParams.to) ?? undefined;
  const month = searchParams.month ? parseInt(searchParams.month) : undefined;
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  
  // Determine filter type
  const shouldFilterByDate = from && to;
  const shouldFilterByMonthOnly = month !== undefined && year === undefined;
  const shouldFilterByYearOnly = month === undefined && year !== undefined;
  
  const status = parseStatus(searchParams.status);
  const query = searchParams.q?.trim() ?? "";

  const numericCode = query.startsWith("CUS-") ? Number(query.replace("CUS-", "")) : Number(query);
  const codeFilter = Number.isFinite(numericCode) ? numericCode : undefined;

  const tenantFilter = await getTenantFilter();
  
  // Build base where clause
  const baseWhere = {
    ...tenantFilter,
    ...(status !== "ALL" ? { status } : {}),
    ...(query
      ? {
          OR: [
            { customer: { name: { contains: query, mode: "insensitive" } } },
            ...(codeFilter ? [{ customer: { customerCode: codeFilter } }] : []),
          ],
        }
      : {}),
  };

  // Build where clause for Prisma query
  let where: any = baseWhere;
  if (shouldFilterByDate) {
    // Both from and to dates are set (specific month/year)
    where = {
      ...baseWhere,
      ...(from ? { billStartDate: { gte: from } } : {}),
      ...(to ? { billEndDate: { lte: to } } : {}),
    };
  } else if (shouldFilterByYearOnly && year !== undefined) {
    // Only year is specified (All Months)
    where = {
      ...baseWhere,
      billStartDate: {
        gte: startOfYear(new Date(year, 0, 1)),
      },
      billEndDate: {
        lte: endOfYear(new Date(year, 11, 31)),
      },
    };
  }

  // Fetch all bills (we'll filter by month in JS if month-only filtering is needed)
  const allBills = await prisma.bill.findMany({
    where,
    include: {
      customer: { select: { customerCode: true, name: true } },
      payments: { select: { amount: true } },
      invoice: { select: { id: true, invoiceNumber: true, generatedAt: true } },
    },
    orderBy: [{ customer: { customerCode: "asc" } }],
  });

  // Filter by month only if month is selected with "All Years"
  let filteredBills = allBills;
  if (shouldFilterByMonthOnly && month !== undefined) {
    filteredBills = allBills.filter((bill) => {
      const billMonth = getMonth(bill.billStartDate);
      return billMonth === month;
    });
  }

  // Calculate totals from filtered bills
  const totalCount = filteredBills.length;
  
  // Apply pagination to filtered bills
  const bills = requestedSize === "all" 
    ? filteredBills 
    : filteredBills.slice((page - 1) * pageSize, page * pageSize);

  // Calculate aggregates from filtered bills
  const billAggregates = {
    _sum: {
      lastMonthRemaining: filteredBills.reduce((sum, bill) => sum + bill.lastMonthRemaining, 0),
      currentMonthBill: filteredBills.reduce((sum, bill) => sum + bill.currentMonthBill, 0),
      cylinders: filteredBills.reduce((sum, bill) => sum + bill.cylinders, 0),
    },
  };
  
  const paymentAggregates = {
    _sum: {
      amount: filteredBills.reduce((sum, bill) => {
        return sum + bill.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
      }, 0),
    },
  };

  const records: PaymentRecordRow[] = bills.map((bill) => {
    const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
    const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const computedStatus =
      remainingAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : ("NOT_PAID" as const);

    return {
      id: bill.id,
      code: String(bill.customer.customerCode),
      name: bill.customer.name,
      lastMonthRemaining: bill.lastMonthRemaining,
      currentMonthBill: bill.currentMonthBill,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: computedStatus,
      billStartDate: bill.billStartDate,
      billEndDate: bill.billEndDate,
      cylinders: bill.cylinders,
      invoice: bill.invoice
        ? {
            id: bill.invoice.id,
            invoiceNumber: bill.invoice.invoiceNumber,
            generatedAt: bill.invoice.generatedAt,
          }
        : null,
    };
  });

  const totalAmount =
    (billAggregates._sum.lastMonthRemaining ?? 0) + (billAggregates._sum.currentMonthBill ?? 0);
  const receivedAmount = paymentAggregates._sum.amount ?? 0;
  const remainingAmount = Math.max(totalAmount - receivedAmount, 0);
  const totalCylinders = billAggregates._sum.cylinders ?? 0;
  const totalPages = requestedSize === "all" ? 1 : Math.max(Math.ceil(totalCount / pageSize), 1);

  return (
    <>
      <div className="rounded-[24px] border border-transparent px-1">
        <h1 className="text-2xl font-semibold text-slate-900">Payment Management</h1>
        <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
      </div>

      <PaymentsFilters initialQuery={query} initialStatus={status} from={from} to={to} />
      <PaymentSummaryCards
        totals={{ totalAmount, receivedAmount, remainingAmount, totalCylinders }}
      />
      <PaymentActionsBar from={from} to={to} />

      <section className="rounded-[32px] border border-[#e5eaf4] bg-white px-4 py-4 shadow-sm lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f3fb] pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Payment Records</h3>
            <p className="text-sm text-slate-500">Latest billing cycle overview</p>
          </div>
        </div>
        <div className="mt-4">
          <PaymentRecordsTable records={records} />
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
    </>
  );
}

function createPaginationHref(params: Record<string, string | undefined>, nextPage: number) {
  const next = new URLSearchParams(params as any);
  next.set("page", String(nextPage));
  return `/payments?${next.toString()}`;
}


