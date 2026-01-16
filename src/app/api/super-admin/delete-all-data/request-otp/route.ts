import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { issueOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
// Core utilities
import { createUnauthorizedResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function POST() {
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

    // Generate OTP
    const { code, expiresAt } = await issueOtp(user.email);

    // Send OTP email
    const emailResult = await sendOtpEmail(user.email, code);

    if (!emailResult.success) {
      return createErrorResponse(
        emailResult.error || "Failed to send verification email. Please check your email configuration.",
        500
      );
    }

    return successResponse({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

