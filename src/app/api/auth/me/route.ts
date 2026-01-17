export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
// Core utilities
import { createUnauthorizedResponse, createNotFoundResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    // Fetch full user details from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        businessName: true,
        branch: true,
        profileImage: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    return successResponse({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
