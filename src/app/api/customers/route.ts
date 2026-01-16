import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { requireEditPermission } from "@/lib/api-permissions";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
// Core utilities
import { parsePaginationParams, getPaginationSkipTake, createPaginatedResponse } from "@/core/data/pagination";
import { buildTextSearchFilter, buildNumericSearchFilter, combineSearchFilters } from "@/core/data/search";
import { getTenantFilter, applyTenantFilter } from "@/core/tenant/tenant-queries";
import { createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { paginatedResponse } from "@/core/api/api-response";

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
      ["name", "contactNumber", "address"]
    );
    
    const numericQuery = pagination.q ? Number(pagination.q) : NaN;
    const numericSearchFilter = !isNaN(numericQuery)
      ? buildNumericSearchFilter(pagination.q, "customerCode")
      : undefined;

    // Combine search filters
    const searchFilter = combineSearchFilters([textSearchFilter, numericSearchFilter]);

    // Apply tenant filter using core utility
    const where = applyTenantFilter(
      searchFilter || {},
      tenantFilter
    );

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { cylinders: true },
        orderBy: { customerCode: "asc" },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    // Return paginated response using core utility
    return paginatedResponse(items, pagination.page, pagination.pageSize, total);
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return createErrorResponse("Failed to fetch customers", 500);
  }
}

export async function POST(request: Request) {
  try {
    // Check edit permission for addCustomer module
    const permissionError = await requireEditPermission("addCustomer");
    if (permissionError) {
      return permissionError;
    }

    const json = await request.json();
    const parseResult = customerSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const payload = parseResult.data;

    const normalizedContacts =
      payload.additionalContacts?.map((contact) => ({
        name: contact.name.trim(),
        contactNumber: contact.contactNumber.trim(),
      })) ?? [];
    const contactNumber = normalizedContacts[0]?.contactNumber || payload.contactNumber;

    if (!contactNumber) {
      return createErrorResponse("At least one contact number is required.", 400);
    }

    const adminId = await getTenantIdForCreate();

    const customer = await prisma.customer.create({
      data: {
        name: payload.name,
        contactNumber,
        customerType: payload.customerType,
        cylinderType: payload.cylinderType,
        billType: payload.billType,
        securityDeposit: payload.securityDeposit ?? null,
        status: payload.status ?? "ACTIVE",
        address: payload.address,
        area: payload.area,
        city: payload.city,
        country: payload.country,
        notes: payload.notes ?? null,
        additionalContacts: normalizedContacts,
        email: payload.email ?? null,
        adminId,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return createErrorResponse("Failed to create customer", 500);
  }
}

