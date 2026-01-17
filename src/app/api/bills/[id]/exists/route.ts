export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessTenantData } from "@/lib/tenant-utils";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billId = params.id;

    if (!billId) {
      return createErrorResponse("Bill ID is required", 400);
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: { id: true, adminId: true },
    });

    if (!bill) {
      return successResponse({ exists: false });
    }

    // Verify access to this bill's tenant data
    const hasAccess = await canAccessTenantData(bill.adminId);
    return successResponse({ exists: hasAccess });
  } catch (error) {
    console.error("Error checking bill existence:", error);
    return createErrorResponse("Failed to check bill existence", 500);
  }
}

