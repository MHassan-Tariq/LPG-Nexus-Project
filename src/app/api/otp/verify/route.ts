import { NextResponse } from "next/server";
import { otpVerifySchema } from "@/lib/validators";
import { verifyOtp } from "@/lib/otp";
// Core utilities
import { createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function POST(request: Request) {
  const json = await request.json();
  const parseResult = otpVerifySchema.safeParse(json);

  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { email, code } = parseResult.data;
  const result = await verifyOtp(email, code);

  if (!result.valid) {
    return createErrorResponse(result.reason, 400);
  }

  return successResponse({ status: "verified" });
}

