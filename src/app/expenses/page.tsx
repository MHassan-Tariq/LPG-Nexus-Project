export const dynamic = "force-dynamic";
export const revalidate = 0;

import { startOfMonth, endOfMonth, startOfYear, endOfYear, parse, getMonth, getYear } from "date-fns";

import { ExpensesBoard } from "@/components/expenses/expenses-board";
import { HeroDatePicker } from "@/components/expenses/hero-date-picker";
import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { enforcePagePermission } from "@/lib/permission-check";
import type { ExpenseCategoryValue } from "@/constants/expense-types";
import { EXPENSE_TYPE_OPTIONS } from "@/constants/expense-types";
import { prisma } from "@/lib/prisma";
import type { ExpenseListItem } from "@/types/expenses";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, "all"];
const DEFAULT_PAGE_SIZE = 5;

interface ExpensesPageProps {
  searchParams: Record<string, string | undefined>;
}

const expenseTypeSet = new Set(EXPENSE_TYPE_OPTIONS.map((option) => option.value));

function parseExpenseType(value?: string) {
  if (!value) return undefined;
  return expenseTypeSet.has(value) ? value : undefined;
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

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/expenses");
  
  const tenantFilter = await getTenantFilter();
  
  // Fetch software name from settings (with tenant filter)
  const softwareNameSetting = await prisma.systemSettings.findFirst({
    where: {
      ...tenantFilter,
      key: "softwareName",
    },
  });
  const softwareName = softwareNameSetting?.value || "LPG Nexus";
  const expenseTypeFilter = parseExpenseType(searchParams.expenseType);
  const requestedPageSize = searchParams.pageSize;
  
  // Handle "all" option or numeric page size
  let pageSize: number;
  if (requestedPageSize === "all") {
    pageSize = 10000; // Large number to show all records
  } else {
    const numericSize = Number(requestedPageSize) || DEFAULT_PAGE_SIZE;
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
  
  // Build base where clause
  const baseWhere = {
    ...tenantFilter,
    ...(expenseTypeFilter ? { expenseType: expenseTypeFilter } : {}),
  };

  // Build where clause for Prisma query
  let where: any = baseWhere;
  if (shouldFilterByDate) {
    // Both month and year are specific
    where = {
      ...baseWhere,
      expenseDate: {
        gte: startOfMonth(parseMonthYear(month, year)!),
        lte: endOfMonth(parseMonthYear(month, year)!),
      },
    };
  } else if (shouldFilterByYearOnly) {
    // Only year is specific (All Months)
    const yearNumber = parseInt(year);
    where = {
      ...baseWhere,
      expenseDate: {
        gte: startOfYear(new Date(yearNumber, 0, 1)),
        lte: endOfYear(new Date(yearNumber, 11, 31)),
      },
    };
  }

  // Fetch all expenses (we'll filter by month in JS if month-only filtering is needed)
  const allExpenses = await prisma.expense.findMany({
    where,
    orderBy: [
      { expenseDate: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      expenseType: true,
      amount: true,
      category: true,
      expenseDate: true,
      description: true,
    },
  });

  // Filter by month only if month is selected with "All Years"
  // (Year-only filtering is already handled in Prisma query above)
  let filteredExpenses = allExpenses;
  if (shouldFilterByMonthOnly && month) {
    const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), "08" to 7 (August), etc. (0-indexed)
    filteredExpenses = allExpenses.filter((expense) => {
      const expenseMonth = getMonth(expense.expenseDate);
      return expenseMonth === selectedMonthNumber;
    });
  }

  // Calculate totals from filtered expenses
  const totalCount = filteredExpenses.length;
  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // If "all" is selected, show all records without pagination
  let page = 1;
  let totalPages = 1;
  let skip = 0;
  let take = pageSize;
  const displayPageSize: number | string = requestedPageSize === "all" ? "all" : pageSize;
  
  if (requestedPageSize !== "all") {
    totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
    page = Math.max(Number(searchParams.page) || 1, 1);
    if (page > totalPages && totalPages > 0) {
      page = totalPages;
    }
    skip = (page - 1) * pageSize;
  } else {
    // For "all", don't use skip/take
    skip = 0;
    take = 10000; // Large number to get all records
    totalPages = 1; // Show "1 of 1" when all records are displayed
  }

  // Apply pagination to filtered expenses
  const paginatedExpenses = filteredExpenses.slice(skip, skip + take);
  
  const serializedExpenses: ExpenseListItem[] = paginatedExpenses.map((expense) => ({
    id: expense.id,
    expenseType: expense.expenseType,
    amount: expense.amount,
    category: expense.category as ExpenseCategoryValue,
    expenseDate: expense.expenseDate.toISOString(),
    description: expense.description,
  }));

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between rounded-[24px] border border-transparent px-1">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Expenses Management</h1>
              <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
            </div>
            <div className="w-full max-w-[240px]">
              <HeroDatePicker />
            </div>
          </div>

          <ExpensesBoard
            expenses={serializedExpenses}
            page={page}
            totalPages={totalPages}
            pageSize={displayPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalExpense={totalExpense}
            expenseTypeFilter={expenseTypeFilter}
            monthFilter={searchParams.month}
            yearFilter={searchParams.year}
          />
        </main>
      </div>
    </div>
  );
}

