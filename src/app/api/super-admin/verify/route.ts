import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
// Core utilities
import { createUnauthorizedResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function POST(request: Request) {
  try {
    const { accessCode, email } = await request.json();

    if (!accessCode) {
      return createErrorResponse("Access code is required", 400);
    }

    // Default access code - change this in production via environment variable
    const DEFAULT_ACCESS_CODE = process.env.SUPER_ADMIN_ACCESS_CODE || "superadmin123";

    // Check for super admin access code in database (if table exists)
    let accessCodeRecord = null;
    try {
      accessCodeRecord = await prisma.superAdminAccessCode.findFirst({
        where: { code: accessCode, isActive: true },
      });
    } catch (dbError: any) {
      // Table might not exist yet - that's okay, we'll use default code
      console.log("SuperAdminAccessCode table not found, using default code");
    }

    // Validate access code
    const isValid = accessCodeRecord !== null || accessCode === DEFAULT_ACCESS_CODE;

    if (!isValid) {
      return createUnauthorizedResponse();
    }

    // If email is provided (from forgot password flow), return user info and token
    if (email) {
      const user = await prisma.user.findFirst({
        where: { email, role: "SUPER_ADMIN" },
        select: { id: true, name: true, email: true, username: true, role: true },
      });

      if (user) {
        // Generate a short-lived token for the reset page (valid for 10 minutes)
        const resetToken = await signToken(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role || "SUPER_ADMIN",
          },
          "10m"
        );

        return successResponse({
          success: true,
          user: {
            name: user.name,
            email: user.email,
            username: user.username,
          },
          token: resetToken,
        });
      }
    }

    // For regular access (dashboard login)
    return successResponse({ success: true });
  } catch (error: any) {
    console.error("Super admin verification error:", error);
    return createErrorResponse(error?.message || "Internal server error", 500);
  }
}

