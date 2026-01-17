export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { CylinderStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";
import { requireEditPermission } from "@/lib/api-permissions";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
// Core utilities
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";
import { buildNestedSearchFilter } from "@/core/data/search";
import { getTenantFilter, applyTenantFilter } from "@/core/tenant/tenant-queries";
import { createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { paginatedResponse, createdResponse } from "@/core/api/api-response";

const STATUS_BY_TRANSACTION: Record<TransactionType, CylinderStatus> = {
  ISSUE: CylinderStatus.ASSIGNED,
  RETURN: CylinderStatus.IN_STOCK,
  MAINTENANCE: CylinderStatus.MAINTENANCE,
  INSPECTION: CylinderStatus.IN_STOCK,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination using core utility
    const pagination = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationSkipTake(pagination.page, pagination.pageSize);
    
    const typeFilter = searchParams.get("type");
    const transactionType = typeFilter && typeFilter in TransactionType ? (typeFilter as TransactionType) : undefined;

    // Get tenant filter using core utility
    const tenantFilter = await getTenantFilter();

    // Build search filters using core utilities
    const searchFilter = pagination.q
      ? {
          OR: [
            { cylinder: { serialNumber: { contains: pagination.q, mode: "insensitive" as const } } },
            { customer: { name: { contains: pagination.q, mode: "insensitive" as const } } },
            { notes: { contains: pagination.q, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Apply tenant filter using core utility
    const where = applyTenantFilter(
      {
        ...(transactionType ? { type: transactionType } : {}),
        ...searchFilter,
      },
      tenantFilter
    );

    const [items, total] = await Promise.all([
      prisma.cylinderTransaction.findMany({
        where,
        include: {
          cylinder: true,
          customer: true,
          user: true,
        },
        orderBy: { recordedAt: "desc" },
        skip,
        take,
      }),
      prisma.cylinderTransaction.count({ where }),
    ]);

    // Return paginated response using core utility
    return paginatedResponse(items, pagination.page, pagination.pageSize, total);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return createErrorResponse("Failed to fetch transactions", 500);
  }
}

export async function POST(request: Request) {
  try {
    // Check edit permission for transactions (usually related to cylinders/customers)
    // Using addCylinder as the module since transactions are typically done when managing cylinders
    const permissionError = await requireEditPermission("addCylinder");
    if (permissionError) {
      return permissionError;
    }

    const json = await request.json();
    const parseResult = transactionSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

  const payload = parseResult.data;
  const adminId = await getTenantIdForCreate();

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.cylinderTransaction.create({
      data: {
        cylinderId: payload.cylinderId,
        customerId: payload.customerId ?? null,
        type: payload.type,
        quantity: payload.quantity,
        recordedAt: payload.recordedAt ?? new Date(),
        dueDate: payload.dueDate ?? null,
        notes: payload.notes ?? null,
        adminId,
      },
    });

    const status = STATUS_BY_TRANSACTION[payload.type];

    await tx.cylinder.update({
      where: { id: payload.cylinderId },
      data: {
        status,
        customerId:
          payload.type === "ISSUE"
            ? payload.customerId ?? null
            : payload.type === "RETURN"
              ? null
              : undefined,
      },
    });

    return created;
  });

    return createdResponse(transaction);
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return createErrorResponse("Failed to create transaction", 500);
  }
}

