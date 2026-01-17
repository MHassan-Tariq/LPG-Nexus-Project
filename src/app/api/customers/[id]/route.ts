export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { requireEditPermission } from "@/lib/api-permissions";
import { canAccessTenantData } from "@/lib/tenant-utils";
// Core utilities
import { createNotFoundResponse, createForbiddenResponse, createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      cylinders: true,
      transactions: {
        include: { cylinder: true },
        orderBy: { recordedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) {
    return createNotFoundResponse("Customer");
  }

  // Verify access to this customer's tenant data
  if (!(await canAccessTenantData(customer.adminId))) {
    return createForbiddenResponse("You do not have permission to view this customer.");
  }

  return successResponse(customer);
}

export async function PATCH(request: Request, { params }: Params) {
  // Check edit permission for addCustomer module
  const permissionError = await requireEditPermission("addCustomer");
  if (permissionError) {
    return permissionError;
  }
  try {
    const json = await request.json();
    const parseResult = customerSchema.partial().safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    // Verify access to this customer's tenant data
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: { adminId: true },
    });

    if (!existingCustomer) {
      return createNotFoundResponse("Customer");
    }

    if (!(await canAccessTenantData(existingCustomer.adminId))) {
      return createForbiddenResponse("You do not have permission to update this customer.");
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: parseResult.data,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("PATCH /api/customers/[id] error:", error);
    return createErrorResponse("Unable to update customer", 400);
  }
}

