"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { UserRole } from "@prisma/client";
import { routeToModuleMap } from "@/lib/route-module-map";

export type AccessLevel = "FULL_ACCESS" | "VIEW_ONLY" | "EDIT" | "NO_ACCESS" | "NOT_SHOW";

/**
 * Check if user has access to a module
 * Returns the access level for the module
 */
export async function checkModuleAccess(moduleId: string): Promise<AccessLevel> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return "NO_ACCESS";
    }

    // SUPER_ADMIN always has FULL_ACCESS
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return "FULL_ACCESS";
    }

    // Get user's permissions from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { permissions: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return "NO_ACCESS";
    }

    // If no permissions set, check role-based defaults
    if (!user.permissions || typeof user.permissions !== "object") {
      // Default behavior based on role
      if (user.role === UserRole.VIEWER) {
        return "VIEW_ONLY";
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.BRANCH_MANAGER) {
        return "EDIT";
      } else {
        return "VIEW_ONLY";
      }
    }

    const permissions = user.permissions as Record<string, AccessLevel>;
    const modulePermission = permissions[moduleId];

    // If no specific permission for this module, use default based on role
    if (!modulePermission) {
      if (user.role === UserRole.VIEWER) {
        return "VIEW_ONLY";
      } else if (user.role === UserRole.ADMIN || user.role === UserRole.BRANCH_MANAGER) {
        return "EDIT";
      } else {
        return "VIEW_ONLY";
      }
    }

    // Only SUPER_ADMIN can have FULL_ACCESS, override if non-SUPER_ADMIN tries to have it
    if (modulePermission === "FULL_ACCESS" && user.role !== UserRole.SUPER_ADMIN) {
      return "EDIT";
    }

    return modulePermission;
  } catch (error) {
    console.error("Error checking module access:", error);
    return "NO_ACCESS";
  }
}

/**
 * Check if user can edit (has EDIT or FULL_ACCESS)
 */
export async function canEdit(moduleId: string): Promise<boolean> {
  const access = await checkModuleAccess(moduleId);
  return access === "EDIT" || access === "FULL_ACCESS";
}

/**
 * Check if user can view (has any access except NO_ACCESS and NOT_SHOW)
 */
export async function canView(moduleId: string): Promise<boolean> {
  const access = await checkModuleAccess(moduleId);
  return access !== "NO_ACCESS" && access !== "NOT_SHOW";
}

/**
 * Get user's permissions for all modules
 */
export async function getUserPermissions(): Promise<Record<string, AccessLevel> | null> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return null;
    }

    // SUPER_ADMIN always has FULL_ACCESS for everything
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return Object.keys(routeToModuleMap).reduce((acc, route) => {
        const module = routeToModuleMap[route];
        if (module) {
          acc[module] = "FULL_ACCESS";
        }
        return acc;
      }, {} as Record<string, AccessLevel>);
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { permissions: true },
    });

    if (!user?.permissions || typeof user.permissions !== "object") {
      return null;
    }

    return user.permissions as Record<string, AccessLevel>;
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return null;
  }
}

