/**
 * Core Permission Guard Utilities
 * 
 * Wraps existing permission checking functions for consistent use.
 * No logic changes - centralized access point.
 */

// Re-export existing permission guards
export {
  requireEditPermission,
  requireViewPermission,
} from "@/lib/api-permissions";

// Re-export permission checking functions
export {
  canEdit,
  canView,
  checkModuleAccess,
} from "@/lib/permissions";

/**
 * Check edit permission and return error object for server actions
 * 
 * @param moduleId - Module identifier
 * @returns Error object if no permission, null if allowed
 */
export async function requireEditPermissionForAction(
  moduleId: string
): Promise<{ success: false; error: string } | null> {
  const { canEdit } = await import("@/lib/permissions");
  const hasPermission = await canEdit(moduleId);

  if (!hasPermission) {
    return {
      success: false,
      error: `You do not have permission to perform this action. Edit access is required for ${moduleId}.`,
    };
  }

  return null;
}

/**
 * Check view permission and return error object for server actions
 * 
 * @param moduleId - Module identifier
 * @returns Error object if no permission, null if allowed
 */
export async function requireViewPermissionForAction(
  moduleId: string
): Promise<{ success: false; error: string } | null> {
  const { checkModuleAccess } = await import("@/lib/permissions");
  const access = await checkModuleAccess(moduleId);

  if (access === "NO_ACCESS" || access === "NOT_SHOW") {
    return {
      success: false,
      error: `You do not have permission to access ${moduleId}.`,
    };
  }

  return null;
}

