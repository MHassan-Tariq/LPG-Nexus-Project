import { startOfDay, endOfDay, startOfMonth, endOfMonth, format, parseISO, getMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

export async function getReportsData(startDateParam: string, endDateParam: string, filterType?: string | null, month?: string | null) {
  const tenantFilter = await getTenantFilter();
  const shouldFilterByMonthOnly = filterType === "monthOnly" && month;
  
  // Determine date range
  // If no params provided, default to current month
  const startDate = startDateParam ? startOfDay(parseISO(startDateParam)) : startOfMonth(new Date());
  const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfMonth(new Date());

  // Calculate previous period for comparison (previous month)
  // Use the same duration as current period, but shifted back by one month
  const prevStartDate = startOfMonth(subMonths(startDate, 1));
  const prevEndDate = endOfMonth(subMonths(startDate, 1));

  // Fetch all data in parallel
  const [
    payments,
    prevPayments,
    expenses,
    prevExpenses,
    cylinderEntries,
    prevCylinderEntries,
    bills,
    prevBills,
    cylinderTransactions,
    prevCylinderTransactions,
    inventoryItems,
    prevInventoryItems,
  ] = await Promise.all([
    // Current period
    prisma.payment.findMany({
      where: {
        ...tenantFilter,
        paidOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paidOn: true,
      },
    }),
    // Previous period
    prisma.payment.findMany({
      where: {
        ...tenantFilter,
        paidOn: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        amount: true,
      },
    }),
    // Current expenses
    prisma.expense.findMany({
      where: {
        ...tenantFilter,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        expenseDate: true,
      },
    }),
    // Previous expenses
    prisma.expense.findMany({
      where: {
        ...tenantFilter,
        expenseDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        amount: true,
      },
    }),
    // Current cylinder entries (only DELIVERED entries for revenue calculation)
    prisma.cylinderEntry.findMany({
      where: {
        ...tenantFilter,
        deliveryDate: {
          gte: startDate,
          lte: endDate,
        },
        cylinderType: "DELIVERED", // Only count delivered cylinders
      },
      select: {
        quantity: true,
        amount: true,
        cylinderLabel: true,
        deliveryDate: true,
      },
    }),
    // Previous cylinder entries (only DELIVERED entries)
    prisma.cylinderEntry.findMany({
      where: {
        ...tenantFilter,
        deliveryDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        cylinderType: "DELIVERED", // Only count delivered cylinders
      },
      select: {
        quantity: true,
      },
    }),
    // Current bills
    prisma.bill.findMany({
      where: {
        ...tenantFilter,
        billStartDate: {
          lte: endDate,
        },
        billEndDate: {
          gte: startDate,
        },
        OR: [
          { status: "NOT_PAID" },
          { status: "PARTIALLY_PAID" },
        ],
      },
      include: {
        payments: {
          select: { amount: true },
        },
      },
    }),
    // Previous bills
    prisma.bill.findMany({
      where: {
        ...tenantFilter,
        billStartDate: {
          lte: prevEndDate,
        },
        billEndDate: {
          gte: prevStartDate,
        },
        OR: [
          { status: "NOT_PAID" },
          { status: "PARTIALLY_PAID" },
        ],
      },
      include: {
        payments: {
          select: { amount: true },
        },
      },
    }),
    // Current cylinder transactions (for usage trend)
    prisma.cylinderTransaction.findMany({
      where: {
        ...tenantFilter,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
        type: "ISSUE",
      },
      select: {
        recordedAt: true,
        quantity: true,
      },
    }),
    // Previous cylinder transactions
    prisma.cylinderTransaction.findMany({
      where: {
        ...tenantFilter,
        recordedAt: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        type: "ISSUE",
      },
      select: {
        recordedAt: true,
        quantity: true,
      },
    }),
    // Current inventory items
    prisma.inventoryItem.findMany({
      where: {
        ...tenantFilter,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        quantity: true,
        entryDate: true,
      },
    }),
    // Previous inventory items
    prisma.inventoryItem.findMany({
      where: {
        ...tenantFilter,
        entryDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        quantity: true,
      },
    }),
  ]);

  // Filter data for month-only filtering if needed (before calculating totals)
  let filteredPayments = payments;
  let filteredCylinderTransactions = cylinderTransactions;
  let filteredCylinderEntries = cylinderEntries;
  let filteredExpenses = expenses;
  let filteredInventoryItems = inventoryItems;

  if (shouldFilterByMonthOnly && month) {
    const selectedMonthNumber = parseInt(month) - 1; // Convert "01" to 0 (January), etc.
    
    filteredPayments = payments.filter((p) => {
      const paidOn = new Date(p.paidOn);
      return getMonth(paidOn) === selectedMonthNumber;
    });

    filteredCylinderTransactions = cylinderTransactions.filter((t) => {
      const recordedAt = new Date(t.recordedAt);
      return getMonth(recordedAt) === selectedMonthNumber;
    });

    filteredCylinderEntries = cylinderEntries.filter((e) => {
      const deliveryDate = new Date(e.deliveryDate);
      return getMonth(deliveryDate) === selectedMonthNumber;
    });

    filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.expenseDate);
      return getMonth(expenseDate) === selectedMonthNumber;
    });

    filteredInventoryItems = inventoryItems.filter((item) => {
      const entryDate = new Date(item.entryDate);
      return getMonth(entryDate) === selectedMonthNumber;
    });
  }

  // Calculate totals using filtered data
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const prevTotalRevenue = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueChange = prevTotalRevenue !== 0 ? ((totalRevenue - prevTotalRevenue) / Math.abs(prevTotalRevenue)) * 100 : (totalRevenue > 0 ? 100 : 0);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const expensesChange = prevTotalExpenses !== 0 ? ((totalExpenses - prevTotalExpenses) / Math.abs(prevTotalExpenses)) * 100 : (totalExpenses > 0 ? 100 : 0);

  const cylindersDelivered = filteredCylinderEntries.reduce((sum, e) => sum + e.quantity, 0);
  const prevCylindersDelivered = prevCylinderEntries.reduce((sum, e) => sum + e.quantity, 0);
  const cylindersChange = prevCylindersDelivered !== 0 ? ((cylindersDelivered - prevCylindersDelivered) / Math.abs(prevCylindersDelivered)) * 100 : (cylindersDelivered > 0 ? 100 : 0);

  const netProfit = totalRevenue - totalExpenses;
  const prevNetProfit = prevTotalRevenue - prevTotalExpenses;
  // Calculate profit change: handle negative and zero previous profit correctly
  let profitChange = 0;
  if (prevNetProfit !== 0) {
    profitChange = ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;
  } else if (netProfit !== 0) {
    // If previous was 0 and current is not 0, show 100% change (or -100% if negative)
    profitChange = netProfit > 0 ? 100 : -100;
  }

  const totalInventoryItems = filteredInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const prevTotalInventoryItems = prevInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryChange = prevTotalInventoryItems > 0 ? ((totalInventoryItems - prevTotalInventoryItems) / prevTotalInventoryItems) * 100 : 0;

  // Calculate monthly data for charts
  const months = [];
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  do {
    months.push({
      label: format(currentMonth, "MMM"),
      start: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
      end: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999),
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  } while (currentMonth <= endMonth);

  // Revenue vs Expenses monthly data
  const revenueExpensesData = months.map((monthInfo) => {
    const monthStart = new Date(Math.max(monthInfo.start.getTime(), startDate.getTime()));
    const monthEnd = new Date(Math.min(monthInfo.end.getTime(), endDate.getTime()));

    const monthPayments = filteredPayments.filter((p) => {
      const paidOn = new Date(p.paidOn);
      return paidOn >= monthStart && paidOn <= monthEnd;
    });

    const monthExpenses = filteredExpenses.filter((e) => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    return {
      month: monthInfo.label,
      payments: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    };
  });

  // Cylinder usage trend
  const usageTrendData = months.map((monthInfo) => {
    const monthStart = new Date(Math.max(monthInfo.start.getTime(), startDate.getTime()));
    const monthEnd = new Date(Math.min(monthInfo.end.getTime(), endDate.getTime()));

    const monthTransactions = filteredCylinderTransactions.filter((t) => {
      const recordedAt = new Date(t.recordedAt);
      return recordedAt >= monthStart && recordedAt <= monthEnd;
    });

    return {
      month: monthInfo.label,
      cylinders: monthTransactions.reduce((sum, t) => sum + t.quantity, 0),
    };
  });

  // Cylinder type distribution
  const cylinderTypes = filteredCylinderEntries.reduce((acc, entry) => {
    const label = entry.cylinderLabel || "Unknown";
    if (!acc[label]) {
      acc[label] = { count: 0, value: 0 };
    }
    acc[label].count += entry.quantity;
    acc[label].value += Number(entry.amount);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const totalCylinderCount = Object.values(cylinderTypes).reduce((sum, type) => sum + type.count, 0);
  const cylinderDistributionData = Object.entries(cylinderTypes).map(([label, data]) => ({
    label: label.replace(/\([^)]*\)/g, "").trim() || label,
    value: data.count,
    percentage: totalCylinderCount > 0 ? Math.round((data.count / totalCylinderCount) * 100) : 0,
  }));

  // Detailed reports table data
  const detailedReports = [
    {
      category: "Cylinder Deliveries",
      count: cylindersDelivered,
      revenue: filteredCylinderEntries.reduce((sum, e) => sum + Number(e.amount), 0),
      growth: cylindersChange,
    },
    {
      category: "Customer Payments",
      count: filteredPayments.length,
      revenue: totalRevenue,
      growth: revenueChange,
    },
    {
      category: "Total Expenses",
      count: filteredExpenses.length,
      revenue: totalExpenses,
      growth: expensesChange,
    },
    {
      category: "Inventory Items",
      count: filteredInventoryItems.length,
      revenue: filteredInventoryItems.reduce((sum, item) => sum + item.quantity, 0),
      growth: inventoryChange,
    },
    {
      category: "Pending Bills",
      count: bills.length,
      revenue: bills.reduce((sum, b) => {
        const totalBillAmount = (b.lastMonthRemaining || 0) + (b.currentMonthBill || 0);
        const totalPaid = b.payments.reduce((paidSum, payment) => paidSum + (payment.amount || 0), 0);
        const remaining = Math.max(0, totalBillAmount - totalPaid);
        return sum + remaining;
      }, 0),
      growth: 0, // Calculate based on previous bills if needed
    },
  ];

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      cylindersDelivered,
      netProfit,
      revenueChange,
      expensesChange,
      cylindersChange,
      profitChange,
    },
    charts: {
      revenueExpenses: revenueExpensesData,
      usageTrend: usageTrendData,
      cylinderDistribution: cylinderDistributionData,
    },
    detailedReports,
    dateRange: {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    },
  };
}

