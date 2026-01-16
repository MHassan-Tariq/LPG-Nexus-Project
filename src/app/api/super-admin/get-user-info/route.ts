import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyToken } from "@/lib/jwt";
// Core utilities
import { createErrorResponse, createUnauthorizedResponse, createNotFoundResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email) {
      return createErrorResponse("Email is required", 400);
    }

    // Verify token if provided
    if (token) {
      const payload = await verifyToken(token);
      if (!payload || payload.email !== email) {
        return createUnauthorizedResponse();
      }
    }

    // Get user info
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: UserRole.SUPER_ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    return successResponse({
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error("Get user info error:", error);
    return createErrorResponse(error?.message || "Internal server error", 500);
  }
}
