import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { issueOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
import { z } from "zod";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = requestResetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid email address", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // Verify that the email belongs to a SUPER_ADMIN
    const superAdmin = await prisma.user.findFirst({
      where: {
        email,
        role: UserRole.SUPER_ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!superAdmin) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If a super admin account exists with this email, a reset code will be sent.",
      });
    }

    // Generate OTP
    const { code, expiresAt } = await issueOtp(email);

    // Send OTP email
    const emailResult = await sendOtpEmail(email, code, superAdmin.name);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send reset code. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reset code sent to your email",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Super admin forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
