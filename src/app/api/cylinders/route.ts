import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cylinderCreateSchema } from "@/lib/validators";
import { requireEditPermission } from "@/lib/api-permissions";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
// Core utilities
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";
import { buildTextSearchFilter, buildNestedSearchFilter, combineSearchFilters } from "@/core/data/search";
import { getTenantFilter, applyTenantFilter } from "@/core/tenant/tenant-queries";
import { createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { paginatedResponse, createdResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination using core utility
    const pagination = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationSkipTake(pagination.page, pagination.pageSize);

    // Get tenant filter using core utility
    const tenantFilter = await getTenantFilter();

    // Build search filters using core utilities
    const textSearchFilter = buildTextSearchFilter(
      pagination.q,
      ["serialNumber", "gasType", "location"]
    );
    
    const nestedSearchFilter = pagination.q
      ? buildNestedSearchFilter(pagination.q, "customer.name")
      : undefined;

    // Combine search filters
    const searchFilter = combineSearchFilters([textSearchFilter, nestedSearchFilter]);

    // Apply tenant filter using core utility
    const where = applyTenantFilter(
      searchFilter || {},
      tenantFilter
    );

    const [items, total] = await Promise.all([
      prisma.cylinder.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.cylinder.count({ where }),
    ]);

    // Return paginated response using core utility
    return paginatedResponse(items, pagination.page, pagination.pageSize, total);
  } catch (error) {
    console.error("GET /api/cylinders error:", error);
    return createErrorResponse("Failed to fetch cylinders", 500);
  }
}

export async function POST(request: Request) {
  try {
    // Check edit permission for addCylinder module
    const permissionError = await requireEditPermission("addCylinder");
    if (permissionError) {
      return permissionError;
    }

    const json = await request.json();
    const parseResult = cylinderCreateSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const payload = parseResult.data;
    const adminId = await getTenantIdForCreate();

    const cylinder = await prisma.cylinder.create({
      data: {
        serialNumber: payload.serialNumber,
        gasType: payload.gasType,
        capacityLiters: payload.capacityLiters,
        status: payload.status,
        location: payload.location,
        pressurePsi: payload.pressurePsi ?? undefined,
        lastInspection: payload.lastInspection ?? undefined,
        nextInspection: payload.nextInspection ?? undefined,
        customerId: payload.customerId ?? undefined,
        notes: payload.notes ?? undefined,
        adminId,
      },
    });

    return createdResponse(cylinder);
  } catch (error) {
    console.error("POST /api/cylinders error:", error);
    return createErrorResponse("Failed to create cylinder", 500);
  }
}
