import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyOtp } from "@/lib/otp";
import { verifyToken } from "@/lib/jwt";
import { z } from "zod";
import { isBefore, subMinutes } from "date-fns";
// Core utilities
import { createValidationErrorResponse, createUnauthorizedResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().optional(), // Code is now optional
  newAccessCode: z.string().min(6, "Access code must be at least 6 characters"),
  token: z.string().optional(), // Token for verification
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = resetSchema.safeParse(body);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const { email, code, newAccessCode, token } = parseResult.data;

    // Verify that the email belongs to a SUPER_ADMIN
    const superAdmin = await prisma.user.findFirst({
      where: {
        email,
        role: UserRole.SUPER_ADMIN,
      },
    });

    if (!superAdmin) {
      return createErrorResponse("Invalid request", 400);
    }

    // Verify token if provided
    if (token) {
      const payload = await verifyToken(token);
      if (!payload || payload.email !== email) {
        return createUnauthorizedResponse();
      }
    }

    // Verify OTP if code is provided (optional verification)
    // Note: If OTP was already verified in the modal flow, we don't need to verify again here
    // We can check if there's a recent verified OTP for this email instead
    if (code) {
      // Check if there's a recently verified OTP (within last 10 minutes)
      const recentOtp = await prisma.otp.findFirst({
        where: {
          email,
          code,
          verifiedAt: {
            not: null,
            gte: new Date(Date.now() - 10 * 60 * 1000), // Verified within last 10 minutes
          },
        },
        orderBy: { verifiedAt: "desc" },
      });

      if (!recentOtp) {
        // If no recent verified OTP, try to verify it now
        const result = await verifyOtp(email, code);

        if (!result.valid) {
          const errorMessage =
            result.reason === "invalid_code"
              ? "Invalid verification code. Please check and try again."
              : result.reason === "expired"
                ? "Verification code has expired. Please request a new one."
                : "Verification failed. Please try again.";
          return createErrorResponse(errorMessage, 400);
        }
      }
      // If recentOtp exists, it's already verified, so we can proceed
    } else {
      // If no code provided, check if there's a recently verified OTP for this email
      // (This handles the case where OTP was verified in modal but not sent in request)
      const recentOtp = await prisma.otp.findFirst({
        where: {
          email,
          verifiedAt: {
            not: null,
            gte: new Date(Date.now() - 10 * 60 * 1000), // Verified within last 10 minutes
          },
        },
        orderBy: { verifiedAt: "desc" },
      });

      if (!recentOtp) {
        return createErrorResponse("Please verify OTP first before resetting the access code.", 400);
      }
    }

    // Update or create SuperAdminAccessCode record
    try {
      // Try to update existing active code
      const existingCode = await prisma.superAdminAccessCode.findFirst({
        where: { isActive: true },
      });

      if (existingCode) {
        await prisma.superAdminAccessCode.update({
          where: { id: existingCode.id },
          data: {
            code: newAccessCode,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new code if none exists
        await prisma.superAdminAccessCode.create({
          data: {
            code: newAccessCode,
            isActive: true,
          },
        });
      }
    } catch (dbError: any) {
      // If table doesn't exist, log warning but allow the flow to continue
      // The user can update the environment variable manually or we can handle it via a different mechanism
      console.warn("SuperAdminAccessCode table not found. Access code cannot be updated in database:", dbError.message);
      // Return success but with a note that manual update may be required
      return successResponse({
        success: true,
        message: "Verification successful. Please contact system administrator to update the access code, or update the SUPER_ADMIN_ACCESS_CODE environment variable.",
        requiresManualUpdate: true,
      });
    }

    return successResponse({
      success: true,
      message: "Access code reset successfully. You can now use the new code to access the dashboard.",
    });
  } catch (error: any) {
    console.error("Super admin reset access code error:", error);
    return createErrorResponse(error?.message || "Internal server error", 500);
  }
}
