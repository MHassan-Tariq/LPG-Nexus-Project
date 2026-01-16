import { NextResponse } from "next/server";
import { checkModuleAccess } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/jwt";
// Core utilities
import { createUnauthorizedResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    // First check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { 
          error: "Please log in to access this page", 
          accessLevel: "NO_ACCESS",
          canView: false,
          canEdit: false
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("module");

    if (!moduleId) {
      return createErrorResponse("Module ID is required", 400);
    }

    const accessLevel = await checkModuleAccess(moduleId);

    return successResponse({
      accessLevel,
      canView: accessLevel !== "NO_ACCESS" && accessLevel !== "NOT_SHOW",
      canEdit: accessLevel === "EDIT" || accessLevel === "FULL_ACCESS",
    });
  } catch (error) {
    console.error("Error checking permissions:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

