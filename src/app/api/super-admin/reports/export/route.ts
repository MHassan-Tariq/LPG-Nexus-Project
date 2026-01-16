import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { UserRole } from "@prisma/client";
// Core utilities
import { createUnauthorizedResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    // Get user's role - only SUPER_ADMIN can export reports
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("Forbidden. Only Super Admins can export reports.");
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";
    const section = searchParams.get("section") || "all";

    // For now, return a simple JSON response
    // In production, you would generate PDF using @react-pdf/renderer or Excel using a library like exceljs
    // This is a placeholder that returns the data in the requested format
    
    if (format === "excel") {
      // For Excel export, return CSV-like data
      // In production, use exceljs to create proper Excel files
      return successResponse({ 
        message: "Excel export will be implemented with exceljs",
        format: "excel",
        section 
      });
    } else {
      // For PDF export, return JSON (placeholder)
      // In production, use @react-pdf/renderer to generate PDF
      return successResponse({ 
        message: "PDF export will be implemented with @react-pdf/renderer",
        format: "pdf",
        section 
      });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
