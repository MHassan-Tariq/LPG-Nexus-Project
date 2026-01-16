import { NextResponse } from "next/server";
import { clearAuthToken } from "@/lib/jwt";
// Core utilities
import { successResponse } from "@/core/api/api-response";

export async function POST() {
  await clearAuthToken();

  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;",
      },
    },
  );
}

