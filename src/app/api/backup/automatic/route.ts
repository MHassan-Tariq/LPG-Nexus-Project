export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { generateBackup } from "@/app/(dashboard)/backup/actions";
// Core utilities
import { createUnauthorizedResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

// This endpoint can be called by a cron job service (e.g., Vercel Cron, GitHub Actions, etc.)
// to perform automatic daily backups at 12 AM
export async function POST(request: Request) {
  try {
    // Verify the request is authorized (you can add API key verification here)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.BACKUP_CRON_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return createUnauthorizedResponse();
    }

    const result = await generateBackup();

    if (!result.success) {
      return createErrorResponse(result.error || "Failed to generate backup", 500);
    }

    // For automatic backups, we return the JSON data
    // The calling service can save it to a configured location
    return successResponse({
      success: true,
      fileName: result.fileName,
      backupId: result.backupId,
      data: result.data,
      message: "Automatic backup generated successfully",
    });
  } catch (error) {
    console.error("Automatic backup error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to generate automatic backup",
      500
    );
  }
}

// GET endpoint to check if automatic backup is configured
export async function GET() {
  return successResponse({
    configured: !!process.env.BACKUP_CRON_TOKEN,
    message: "Automatic backup endpoint is available",
  });
}
