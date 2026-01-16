import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyOtp } from "@/lib/otp";
import { signToken } from "@/lib/jwt";
// Core utilities
import { createUnauthorizedResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function POST(request: Request) {
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
      return createForbiddenResponse("Forbidden. Only Super Admins can perform this action.");
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return createErrorResponse("Verification code is required", 400);
    }

    // Verify OTP
    const result = await verifyOtp(user.email, code);

    if (!result.valid) {
      const errorMessage =
        result.reason === "invalid_code"
          ? "Invalid verification code. Please check and try again."
          : result.reason === "expired"
            ? "Verification code has expired. Please request a new one."
            : "Verification failed. Please try again.";
      return createErrorResponse(errorMessage, 400);
    }

    // Generate a short-lived token for the confirmation page (valid for 10 minutes)
    const confirmToken = await signToken(
      {
        userId: currentUser.userId,
        email: user.email,
        name: currentUser.name,
        username: currentUser.username,
        role: user.role,
      },
      "10m"
    );

    return successResponse({
      success: true,
      token: confirmToken,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
