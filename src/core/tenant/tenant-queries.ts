/**
 * Core Tenant Query Utilities
 * 
 * Wraps existing tenant-utils functions to provide a consistent core API.
 * No logic changes - just centralized access point.
 */

// Re-export all tenant utilities from existing lib
export {
  getCurrentAdminId,
  isSuperAdmin,
  getTenantFilter,
  getTenantIdForCreate,
  canAccessTenantData,
  getSystemSettingsAdminId,
  getSystemSettingsFilter,
} from "@/lib/tenant-utils";

/**
 * Type for tenant filter (adminId or empty object for super admin)
 */
export type TenantFilter = { adminId?: string } | {};

/**
 * Apply tenant filter to a Prisma where clause
 * 
 * @param where - Existing where clause
 * @param tenantFilter - Tenant filter from getTenantFilter()
 * @returns Combined where clause with tenant filter
 */
export function applyTenantFilter<T extends Record<string, any>>(
  where: T,
  tenantFilter: TenantFilter
): T & TenantFilter {
  return {
    ...where,
    ...tenantFilter,
  };
}

