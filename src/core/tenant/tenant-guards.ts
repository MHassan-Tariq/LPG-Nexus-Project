/**
 * Core Tenant Guard Utilities
 * 
 * Provides guard functions for tenant access checks.
 * Wraps existing tenant utilities without changing behavior.
 */

import { canAccessTenantData } from "./tenant-queries";
import { NextResponse } from "next/server";

/**
 * Check tenant access and return error response if denied
 * 
 * @param recordAdminId - The adminId of the record being accessed
 * @returns NextResponse error if access denied, null if allowed
 */
export async function requireTenantAccess(
  recordAdminId: string | null
): Promise<NextResponse | null> {
  const hasAccess = await canAccessTenantData(recordAdminId);

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: "You do not have permission to access this resource.",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  return null;
}

