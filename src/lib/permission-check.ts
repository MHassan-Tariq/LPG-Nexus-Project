"use server";

import { redirect } from "next/navigation";
import { checkModuleAccess } from "@/lib/permissions";
import { getModuleFromRoute } from "@/lib/route-module-map";
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Check if user has access to a route and redirect if they don't
 * Call this at the start of page components to enforce permissions
 */
export async function enforcePagePermission(pathname: string) {
  noStore();
  // Never check permissions for access-denied page (prevents loops)
  if (pathname === "/access-denied") {
    return true;
  }

  const moduleId = getModuleFromRoute(pathname);
  
  if (!moduleId) {
    // No module found for this route, allow access
    return true;
  }

  const accessLevel = await checkModuleAccess(moduleId);

  // NOT_SHOW pages should redirect (they shouldn't be accessible at all)
  if (accessLevel === "NOT_SHOW") {
    redirect("/access-denied");
  }

  // NO_ACCESS pages: Allow access - page will show blurred with message overlay (handled by PermissionGuard)
  // Don't redirect - let the page render so PermissionGuard can show the blurred overlay

  return accessLevel;
}
