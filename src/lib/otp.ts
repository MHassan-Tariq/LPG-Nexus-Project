import { addMinutes, isBefore } from "date-fns";
import { prisma } from "./prisma";

const OTP_EXPIRATION_MINUTES = 10;

function generateNumericOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export async function issueOtp(email: string) {
  const code = generateNumericOtp(6);
  const expiresAt = addMinutes(new Date(), OTP_EXPIRATION_MINUTES);

  await prisma.otp.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifyOtp(email: string, code: string) {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code,
      verifiedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { valid: false, reason: "invalid_code" } as const;
  }

  if (isBefore(otpRecord.expiresAt, new Date())) {
    return { valid: false, reason: "expired" } as const;
  }

  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { verifiedAt: new Date() },
  });

  return { valid: true } as const;
}

