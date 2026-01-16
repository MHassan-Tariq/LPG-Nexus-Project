"use server";

import { NextResponse } from "next/server";
import { canEdit, checkModuleAccess } from "@/lib/permissions";

/**
 * Check if user can edit a module and return error response if not
 * Use this in API routes that modify data (POST, PATCH, DELETE)
 */
export async function requireEditPermission(moduleId: string): Promise<NextResponse | null> {
  const hasEditAccess = await canEdit(moduleId);
  
  if (!hasEditAccess) {
    return NextResponse.json(
      { 
        error: "You do not have permission to perform this action. Edit access is required.",
        code: "FORBIDDEN"
      },
      { status: 403 }
    );
  }
  
  return null; // Permission granted
}

/**
 * Check if user can view a module and return error response if not
 * Use this in API routes that read data (GET)
 */
export async function requireViewPermission(moduleId: string): Promise<NextResponse | null> {
  const access = await checkModuleAccess(moduleId);
  
  if (access === "NO_ACCESS" || access === "NOT_SHOW") {
    return NextResponse.json(
      { 
        error: "You do not have permission to access this resource.",
        code: "FORBIDDEN"
      },
      { status: 403 }
    );
  }
  
  return null; // Permission granted
}
