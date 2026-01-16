import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET() {
  try {
    const tenantFilter = await getTenantFilter();
    const setting = await prisma.systemSettings.findFirst({
      where: {
        ...tenantFilter,
        key: "chatbotVisible",
      },
    });

    // Default to true if not set
    const visible = setting?.value !== "false";

    return successResponse({ visible });
  } catch (error) {
    console.error("Error fetching chatbot visibility:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { visible } = await request.json();

    if (typeof visible !== "boolean") {
      return createErrorResponse("Visible must be a boolean", 400);
    }

    const adminId = await getTenantIdForCreate();
    await prisma.systemSettings.upsert({
      where: {
        adminId_key: {
          adminId: adminId || null,
          key: "chatbotVisible",
        },
      },
      update: { value: String(visible) },
      create: {
        key: "chatbotVisible",
        value: String(visible),
        adminId: adminId || null,
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error saving chatbot visibility:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

