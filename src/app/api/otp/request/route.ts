import { NextResponse } from "next/server";
import { otpRequestSchema } from "@/lib/validators";
import { issueOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
// Core utilities
import { createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function POST(request: Request) {
  const json = await request.json();
  const parseResult = otpRequestSchema.safeParse(json);

  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { email } = parseResult.data;

  const { code, expiresAt } = await issueOtp(email);
  const emailResult = await sendOtpEmail(email, code);

  if (!emailResult.success) {
    return createErrorResponse(
      emailResult.error || "Failed to send OTP email. Email service may not be configured.",
      500
    );
  }

  return successResponse({ status: "sent", expiresAt });
}

