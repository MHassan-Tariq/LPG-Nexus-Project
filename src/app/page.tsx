export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PaymentEventType, BillStatus } from "@prisma/client";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parse, getMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { enforcePagePermission } from "@/lib/permission-check";
import { PagePermissionWrapper } from "@/components/permissions/page-permission-wrapper";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

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

interface DashboardPageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/");
  const tenantFilter = await getTenantFilter();
  
  // Get month/year filters from URL
  const month = searchParams.month;
  const year = searchParams.year;
  
  // Determine filter type
  const shouldFilterByDate = month && month !== "ALL" && year && year !== "ALL";
  const shouldFilterByMonthOnly = month && month !== "ALL" && (!year || year === "ALL");
  const shouldFilterByYearOnly = (!month || month === "ALL") && year && year !== "ALL";
  
  // Build date filter for expenses, bills, payments, etc.
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
  // Build where clauses with date filters
  const expensesWhere = {
    ...tenantFilter,
    ...(dateFilter ? { expenseDate: dateFilter } : {}),
  };
  
  const billsWhere = {
    ...tenantFilter,
    status: {
      in: [BillStatus.NOT_PAID, BillStatus.PARTIALLY_PAID],
    },
    ...(dateFilter ? {
      // Bill overlaps with date range if: billStartDate <= filterEndDate AND billEndDate >= filterStartDate
      billStartDate: { lte: dateFilter.lte },
      billEndDate: { gte: dateFilter.gte },
    } : {}),
  };
  
  const paymentsWhere = {
    ...tenantFilter,
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };
  
  const cylinderEntriesWhere = {
    ...tenantFilter,
    ...(dateFilter ? { deliveryDate: dateFilter } : {}),
  };
  
  const paymentLogsWhere = {
    ...tenantFilter,
    ...(dateFilter ? { performedAt: dateFilter } : {}),
  };
  
  const transactionsWhere = {
    ...tenantFilter,
    ...(dateFilter ? { recordedAt: dateFilter } : {}),
  };

  // Fetch expenses based on filter type
  let expenses;
  if (shouldFilterByMonthOnly && month) {
    // Month-only filter: fetch all expenses, then filter by month in JS
    const allExpenses = await prisma.expense.findMany({
      where: tenantFilter,
      select: {
        category: true,
        amount: true,
        expenseDate: true,
      },
    });
    const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), etc.
    expenses = allExpenses.filter((expense) => {
      const expenseMonth = getMonth(expense.expenseDate);
      return expenseMonth === selectedMonthNumber;
    });
  } else {
    // Year-only or month+year filter: use Prisma date filter
    expenses = await prisma.expense.findMany({
      where: expensesWhere,
      select: {
        category: true,
        amount: true,
        expenseDate: true,
      },
    });
  }

  // For month-only filtering, we need to fetch all data and filter in JS
  const selectedMonthNumber = shouldFilterByMonthOnly && month ? parseInt(month) - 1 : null;

  const [customerTotal, allTransactions, allPaymentLogs, inventoryItems, allBillsData, allPaymentsData, allCylinderEntries] = await Promise.all([
    prisma.customer.count({ where: tenantFilter }),
    // Fetch all transactions for month-only filtering, or use filtered query
    shouldFilterByMonthOnly
      ? prisma.cylinderTransaction.findMany({
          where: tenantFilter,
          include: {
            customer: true,
          },
          orderBy: { recordedAt: "desc" },
        })
      : prisma.cylinderTransaction.findMany({
          where: transactionsWhere,
          include: {
            customer: true,
          },
          orderBy: { recordedAt: "desc" },
          take: 5,
        }),
    // Fetch all payment logs for month-only filtering, or use filtered query
    shouldFilterByMonthOnly
      ? prisma.paymentLog.findMany({
          where: tenantFilter,
          orderBy: { performedAt: "desc" },
        })
      : prisma.paymentLog.findMany({
          where: paymentLogsWhere,
          orderBy: { performedAt: "desc" },
          take: 5,
        }),
    prisma.inventoryItem.findMany({
      where: tenantFilter,
      select: {
        quantity: true,
      },
    }),
    // Fetch all bills for month-only filtering, or use filtered query
    shouldFilterByMonthOnly
      ? prisma.bill.findMany({
          where: {
            ...tenantFilter,
            status: {
              in: [BillStatus.NOT_PAID, BillStatus.PARTIALLY_PAID],
            },
          },
          include: {
            payments: {
              select: {
                amount: true,
              },
            },
          },
        })
      : prisma.bill.findMany({
          where: billsWhere,
          include: {
            payments: {
              select: {
                amount: true,
              },
            },
          },
        }),
    // Fetch all payments for month-only filtering, or use filtered query
    shouldFilterByMonthOnly
      ? prisma.payment.findMany({
          where: tenantFilter,
          select: {
            amount: true,
            createdAt: true,
          },
        })
      : prisma.payment.findMany({
          where: paymentsWhere,
          select: {
            amount: true,
            createdAt: true,
          },
        }),
    // Fetch all cylinder entries for month-only filtering, or use filtered query
    shouldFilterByMonthOnly
      ? prisma.cylinderEntry.findMany({
          where: tenantFilter,
          select: {
            cylinderType: true,
            quantity: true,
            emptyCylinderReceived: true,
            deliveryDate: true,
          },
        })
      : prisma.cylinderEntry.findMany({
          where: cylinderEntriesWhere,
          select: {
            cylinderType: true,
            quantity: true,
            emptyCylinderReceived: true,
            deliveryDate: true,
          },
        }),
  ]);

  // Apply month-only filtering in JavaScript if needed
  let recentTransactions = allTransactions;
  let recentPaymentLogs = allPaymentLogs;
  let pendingBillsData = allBillsData;
  let allPayments = allPaymentsData;
  let cylinderEntries = allCylinderEntries;

  if (shouldFilterByMonthOnly && selectedMonthNumber !== null) {
    // Filter transactions by month
    recentTransactions = allTransactions
      .filter((transaction) => {
        const transactionMonth = getMonth(transaction.recordedAt);
        return transactionMonth === selectedMonthNumber;
      })
      .slice(0, 5); // Take top 5 after filtering

    // Filter payment logs by month
    recentPaymentLogs = allPaymentLogs
      .filter((log) => {
        const logMonth = getMonth(log.performedAt);
        return logMonth === selectedMonthNumber;
      })
      .slice(0, 5); // Take top 5 after filtering

    // Filter bills by month (check if bill period overlaps with selected month)
    pendingBillsData = allBillsData.filter((bill) => {
      if (!bill.billStartDate || !bill.billEndDate) return false;
      const billStartMonth = getMonth(bill.billStartDate);
      const billEndMonth = getMonth(bill.billEndDate);
      // Bill overlaps with selected month if:
      // - Selected month is between start and end month, OR
      // - Bill spans across the selected month (start <= selected <= end)
      return (
        (billStartMonth <= selectedMonthNumber && billEndMonth >= selectedMonthNumber) ||
        (billStartMonth === selectedMonthNumber) ||
        (billEndMonth === selectedMonthNumber)
      );
    });

    // Filter payments by month
    allPayments = allPaymentsData.filter((payment) => {
      const paymentMonth = getMonth(payment.createdAt);
      return paymentMonth === selectedMonthNumber;
    });

    // Filter cylinder entries by month
    cylinderEntries = allCylinderEntries.filter((entry) => {
      if (!entry.deliveryDate) return false;
      const entryMonth = getMonth(entry.deliveryDate);
      return entryMonth === selectedMonthNumber;
    });
  } else {
    // For non-month-only filters, limit to top 5 for display
    recentTransactions = recentTransactions.slice(0, 5);
    recentPaymentLogs = recentPaymentLogs.slice(0, 5);
  }

  // Calculate cylinder counts from CylinderEntry
  // Total cylinders = sum of all cylinder entry quantities in the filtered period
  // This represents the total cylinders involved in transactions during the filtered period
  const cylinderTotal = cylinderEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);

  // In count = sum of RECEIVED entries
  const inCount = cylinderEntries
    .filter((entry) => entry.cylinderType === "RECEIVED")
    .reduce((sum, entry) => sum + (entry.quantity || 0), 0);

  // Out count = sum of DELIVERED entries
  const outCount = cylinderEntries
    .filter((entry) => entry.cylinderType === "DELIVERED")
    .reduce((sum, entry) => sum + (entry.quantity || 0), 0);

  // Empty count = sum of emptyCylinderReceived from RECEIVED entries
  const emptyCount = cylinderEntries
    .filter((entry) => entry.cylinderType === "RECEIVED")
    .reduce((sum, entry) => sum + (entry.emptyCylinderReceived || 0), 0);
  const todayLabel = format(new Date(), "MMMM do, yyyy");

  // Calculate expenses by category
  const homeExpenses = expenses
    .filter((expense) => expense.category === "HOME")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const otherExpenses = expenses
    .filter((expense) => expense.category === "OTHER")
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate total inventory quantity
  const totalInventoryQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate pending bills amount (total bill amount minus payments made)
  const pendingBillsAmount = pendingBillsData.reduce((sum, bill) => {
    const totalBillAmount = bill.lastMonthRemaining + bill.currentMonthBill;
    const totalPaid = bill.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0);
    const remaining = totalBillAmount - totalPaid;
    return sum + Math.max(0, remaining); // Ensure no negative values
  }, 0);

  // Calculate total revenue from all payments received
  const paymentsReceived = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total revenue from all bills (paid + pending)
  // This includes both payments received and bill receivables
  let allBills;
  if (shouldFilterByMonthOnly && selectedMonthNumber !== null) {
    // For month-only filtering, fetch all bills and filter in JS
    const allBillsData = await prisma.bill.findMany({
      where: tenantFilter,
      select: {
        lastMonthRemaining: true,
        currentMonthBill: true,
        billStartDate: true,
        billEndDate: true,
      },
    });
    // Filter bills by month (check if bill period overlaps with selected month)
    allBills = allBillsData.filter((bill) => {
      if (!bill.billStartDate || !bill.billEndDate) return false;
      const billStartMonth = getMonth(bill.billStartDate);
      const billEndMonth = getMonth(bill.billEndDate);
      // Bill overlaps with selected month if:
      // - Selected month is between start and end month, OR
      // - Bill spans across the selected month (start <= selected <= end)
      return (
        (billStartMonth <= selectedMonthNumber && billEndMonth >= selectedMonthNumber) ||
        (billStartMonth === selectedMonthNumber) ||
        (billEndMonth === selectedMonthNumber)
      );
    });
  } else {
    // For year-only or month+year filtering, use Prisma date filter
    const allBillsWhere = {
      ...tenantFilter,
      ...(dateFilter ? {
        // Bill overlaps with date range if: billStartDate <= filterEndDate AND billEndDate >= filterStartDate
        billStartDate: { lte: dateFilter.lte },
        billEndDate: { gte: dateFilter.gte },
      } : {}),
    };
    allBills = await prisma.bill.findMany({
      where: allBillsWhere,
      select: {
        lastMonthRemaining: true,
        currentMonthBill: true,
      },
    });
  }
  const totalBillAmount = allBills.reduce((sum, bill) => sum + bill.lastMonthRemaining + bill.currentMonthBill, 0);

  // Total Revenue = Payments received + Pending bills (bill receivables)
  // This represents the total revenue generated (both collected and to be collected)
  const totalRevenue = paymentsReceived + pendingBillsAmount;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate profit (Total Revenue - Expenses)
  // Total Revenue includes both payments received and pending bills
  const profit = totalRevenue - totalExpenses;

  // Bill Receivables = Pending Bills Amount (amounts owed by customers)
  const billReceivables = pendingBillsAmount;

  const paymentLogs =
    recentPaymentLogs.length > 0
      ? recentPaymentLogs.map((log) => {
          const amount = log.amount
            ? Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(log.amount)
            : "Rs 0";
          return {
            id: log.id,
            name: log.customerName,
            billStartDate: log.billStartDate ? format(log.billStartDate, "dd-MM-yy") : "—",
            billEndDate: log.billEndDate ? format(log.billEndDate, "dd-MM-yy") : "—",
            amount,
            performedAt: format(log.performedAt, "dd-MM-yy hh:mm a"),
            eventType: log.eventType,
            details: log.details ?? "—",
          };
        })
      : [];

  return (
    <PagePermissionWrapper pathname="/">
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <DashboardClient
            initialMetrics={{
              homeExpenses,
              otherExpenses,
              counterSale: 0,
              billReceivables,
              profit,
              pendingBills: pendingBillsAmount,
              pendingCustomers: customerTotal,
            }}
            initialCylinders={{
              total: cylinderTotal,
              inCount,
              outCount,
              empty: emptyCount,
            }}
            initialPaymentLogs={paymentLogs}
          />
        </main>
      </div>
    </div>
      </PagePermissionWrapper>
  );
}
