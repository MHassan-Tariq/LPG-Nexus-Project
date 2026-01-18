import "server-only";
import { cache } from "react";
import { getCurrentUser } from "./jwt";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

/**
 * Get the adminId (tenant ID) for the current user
 * 
 * Rules:
 * - SUPER_ADMIN: returns null (no tenant, system-level access)
 * - ADMIN: returns their own userId (they own their tenant)
 * - STAFF/VIEWER/BRANCH_MANAGER: returns their adminId (their Admin's userId)
 */
export const getCurrentAdminId = cache(async (): Promise<string | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  // If adminId is in JWT, use it
  if (currentUser.adminId) {
    return currentUser.adminId;
  }

  // Otherwise, fetch from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { id: true, role: true, adminId: true },
  });

  if (!user) {
    return null;
  }

  // SUPER_ADMIN has no tenant
  if (user.role === UserRole.SUPER_ADMIN) {
    return null;
  }

  // ADMIN owns their tenant (adminId = their own id)
  if (user.role === UserRole.ADMIN) {
    return user.id;
  }

  // STAFF/VIEWER/BRANCH_MANAGER belong to their Admin's tenant
  return user.adminId;
});

/**
 * Check if current user is Super Admin
 */
export const isSuperAdmin = cache(async (): Promise<boolean> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return false;
  }

  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Double-check from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { role: true },
  });

  return user?.role === UserRole.SUPER_ADMIN;
});

/**
 * Build tenant filter for Prisma queries
 * 
 * Returns:
 * - For SUPER_ADMIN: {} (no filter, can see all)
 * - For others: { adminId: currentAdminId } (filtered to their tenant)
 */
export const getTenantFilter = cache(async (): Promise<{ adminId?: string } | {}> => {
  const isSuper = await isSuperAdmin();
  if (isSuper) {
    return {}; // Super Admin sees all
  }

  const adminId = await getCurrentAdminId();
  if (!adminId) {
    // If no adminId, return filter that matches nothing (safety)
    return { adminId: "NO_TENANT_ACCESS" };
  }

  return { adminId };
});

/**
 * Get adminId for creating new records
 * 
 * Returns the adminId that should be assigned to new records.
 * Throws error if user doesn't have a valid tenant.
 */
export const getTenantIdForCreate = cache(async (): Promise<string> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Cannot create record: User not authenticated");
  }

  // Fetch user from database to get role and adminId
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { id: true, role: true, adminId: true },
  });

  if (!user) {
    throw new Error("Cannot create record: User not found in database");
  }

  // SUPER_ADMIN: Use first available ADMIN user's id as default tenant
  if (user.role === UserRole.SUPER_ADMIN) {
    const firstAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    
    if (!firstAdmin) {
      throw new Error("Cannot create record: No ADMIN user found. Please create an ADMIN user first.");
    }
    
    return firstAdmin.id;
  }

  // ADMIN owns their tenant (adminId = their own id)
  if (user.role === UserRole.ADMIN) {
    // Ensure ADMIN has adminId set (fix if missing)
    if (user.adminId !== user.id) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { adminId: user.id },
        });
      } catch (e) {
        console.error("Failed to fix ADMIN user adminId:", e);
      }
    }
    return user.id;
  }

  // STAFF/VIEWER/BRANCH_MANAGER belong to their Admin's tenant
  if (!user.adminId) {
    throw new Error("Cannot create record: User does not belong to a tenant. Please contact your administrator.");
  }

  return user.adminId;
});

/**
 * Verify user has access to a specific tenant's data
 * 
 * @param recordAdminId - The adminId of the record being accessed
 */
export const canAccessTenantData = cache(async (recordAdminId: string | null): Promise<boolean> => {
  const isSuper = await isSuperAdmin();
  if (isSuper) {
    return true; // Super Admin can access all
  }

  const currentAdminId = await getCurrentAdminId();
  if (!currentAdminId) {
    return false;
  }

  return currentAdminId === recordAdminId;
});

/**
 * Get adminId for SystemSettings (software name, logo, etc.)
 * 
 * SystemSettings should be per-tenant, so:
 * - SUPER_ADMIN: Uses first ADMIN user's ID (same as getTenantIdForCreate)
 * - ADMIN: Uses their own ID
 * - Others: Uses their admin's ID
 * 
 * This ensures settings are saved and loaded with the same adminId.
 */
export const getSystemSettingsAdminId = cache(async (): Promise<string> => {
  return await getTenantIdForCreate();
});

/**
 * Get tenant filter for SystemSettings queries
 * 
 * Returns the adminId filter that matches the adminId used when saving settings.
 * This ensures we load the same settings that were saved.
 */
export const getSystemSettingsFilter = cache(async (): Promise<{ adminId: string }> => {
  const adminId = await getSystemSettingsAdminId();
  return { adminId };
});

