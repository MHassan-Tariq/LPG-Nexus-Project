import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cylinderUpdateSchema } from "@/lib/validators";
import { requireEditPermission } from "@/lib/api-permissions";
// Core utilities
import { createNotFoundResponse, createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse, noContentResponse } from "@/core/api/api-response";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const cylinder = await prisma.cylinder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      transactions: {
        include: {
          customer: true,
          user: true,
        },
        orderBy: { recordedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!cylinder) {
    return createNotFoundResponse("Cylinder");
  }

  return successResponse(cylinder);
}

export async function PATCH(request: Request, { params }: Params) {
  // Check edit permission for addCylinder module
  const permissionError = await requireEditPermission("addCylinder");
  if (permissionError) {
    return permissionError;
  }
  try {
    const json = await request.json();
    const parseResult = cylinderUpdateSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const payload = parseResult.data;

    const updated = await prisma.cylinder.update({
      where: { id: params.id },
      data: {
        ...payload,
        pressurePsi: payload.pressurePsi ?? undefined,
        lastInspection: payload.lastInspection ?? undefined,
        nextInspection: payload.nextInspection ?? undefined,
        customerId: payload.customerId ?? undefined,
        notes: payload.notes ?? undefined,
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("PATCH /api/cylinders/[id] error:", error);
    return createErrorResponse("Unable to update cylinder", 400);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  // Check edit permission for addCylinder module
  const permissionError = await requireEditPermission("addCylinder");
  if (permissionError) {
    return permissionError;
  }
  try {
    await prisma.cylinder.delete({ where: { id: params.id } });
    return noContentResponse();
  } catch (error) {
    console.error("DELETE /api/cylinders/[id] error:", error);
    return createErrorResponse("Unable to delete cylinder", 400);
  }
}

