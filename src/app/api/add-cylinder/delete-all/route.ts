import { NextResponse } from "next/server";
import { deleteAllCylinderEntries } from "@/app/(dashboard)/add-cylinder/actions";
// Core utilities
import { createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function DELETE() {
  try {
    const result = await deleteAllCylinderEntries();
    
    if (result.success) {
      return successResponse({
        success: true,
        message: result.message,
        count: result.count,
      });
    } else {
      return createForbiddenResponse(result.error || "Failed to delete cylinder entries");
    }
  } catch (error) {
    console.error("Error in delete-all API route:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to delete cylinder entries",
      500
    );
  }
}

