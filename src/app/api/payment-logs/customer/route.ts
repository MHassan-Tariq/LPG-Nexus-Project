import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";
import { getTenantFilter, applyTenantFilter } from "@/core/tenant/tenant-queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get("customerName");

    if (!customerName) {
      return createErrorResponse("Customer name is required", 400);
    }

    // Get tenant filter using core utility
    const tenantFilter = await getTenantFilter();

    // Apply tenant filter using core utility
    const where = applyTenantFilter(
      {
        customerName: {
          equals: customerName,
          mode: "insensitive",
        },
      },
      tenantFilter
    );

    const logs = await prisma.paymentLog.findMany({
      where,
      orderBy: { performedAt: "desc" },
    });

    return successResponse({ data: logs });
  } catch (error) {
    console.error("Error fetching payment logs:", error);
    return createErrorResponse("Failed to fetch payment logs", 500);
  }
}

