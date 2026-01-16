import { NextResponse } from "next/server";
import { subMonths, startOfMonth } from "date-fns";
import { CylinderStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET() {
  const tenantFilter = await getTenantFilter();
  
  const [totalCylinders, totalCustomers, statusBreakdown, recentTransactions] = await Promise.all([
    prisma.cylinder.count({ where: tenantFilter }),
    prisma.customer.count({ where: tenantFilter }),
    prisma.cylinder.groupBy({
      by: ["status"],
      where: tenantFilter,
      _count: { status: true },
    }),
    prisma.cylinderTransaction.findMany({
      where: {
        ...tenantFilter,
        recordedAt: {
          gte: subMonths(new Date(), 6),
        },
      },
      orderBy: { recordedAt: "asc" },
    }),
  ]);

  const statusSummary = Object.values(CylinderStatus).map((status) => ({
    status,
    count: statusBreakdown.find((item) => item.status === status)?._count.status ?? 0,
  }));

  const monthlyTotals = Array.from({ length: 6 }).map((_, index) => {
    const monthStart = startOfMonth(subMonths(new Date(), 5 - index));
    const monthKey = monthStart.toISOString().slice(0, 7);

    const monthTransactions = recentTransactions.filter((trx) => {
      const trxMonth = startOfMonth(trx.recordedAt).toISOString().slice(0, 7);
      return trxMonth === monthKey;
    });

    const counts: Record<TransactionType, number> = {
      ISSUE: 0,
      RETURN: 0,
      MAINTENANCE: 0,
      INSPECTION: 0,
    };

    monthTransactions.forEach((trx) => {
      counts[trx.type] += trx.quantity;
    });

    return {
      month: monthStart.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      ...counts,
    };
  });

  return successResponse({
    totals: {
      cylinders: totalCylinders,
      customers: totalCustomers,
    },
    statuses: statusSummary,
    usage: monthlyTotals,
  });
}

