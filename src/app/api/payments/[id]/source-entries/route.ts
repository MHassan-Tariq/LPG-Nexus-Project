import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Core utilities
import { createNotFoundResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!customerId || !from || !to) {
      return createErrorResponse("Missing required parameters: customerId, from, to", 400);
    }

    // Fetch bill to verify it exists
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true } },
      },
    });

    if (!bill) {
      return createNotFoundResponse("Bill");
    }

    // Fetch DELIVERED cylinder entries for this customer in the bill date range
    const entries = await prisma.cylinderEntry.findMany({
      where: {
        customerId: bill.customer.id,
        cylinderType: "DELIVERED",
        deliveryDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: {
        id: true,
        deliveryDate: true,
        quantity: true,
        unitPrice: true,
        amount: true,
        cylinderLabel: true,
      },
      orderBy: {
        deliveryDate: "asc",
      },
    });

    return successResponse({
      success: true,
      entries,
      count: entries.length,
    });
  } catch (error: any) {
    console.error("Error fetching source entries:", error);
    return createErrorResponse(error?.message || "Failed to fetch source entries", 500);
  }
}
