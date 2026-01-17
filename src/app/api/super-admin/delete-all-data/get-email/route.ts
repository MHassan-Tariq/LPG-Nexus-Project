export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
// Core utilities
import { createUnauthorizedResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    // Check if user is SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true, email: true },
    });

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("Forbidden");
    }

    return successResponse({ email: user.email });
  } catch (error) {
    console.error("Error fetching admin email:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
