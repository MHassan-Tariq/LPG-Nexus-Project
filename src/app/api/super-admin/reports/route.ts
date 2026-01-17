export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { UserRole } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import { isSuperAdmin } from "@/lib/tenant-utils";
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

    // Only SUPER_ADMIN can access reports
    if (!(await isSuperAdmin())) {
      return createForbiddenResponse("Forbidden. Only Super Admins can access reports.");
    }

    // Get all Admin users (tenants) for tenant identification
    const adminUsers = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const adminMap = new Map(adminUsers.map(admin => [admin.id, admin]));

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
    const moduleFilter = searchParams.get("module");
    const userIdFilter = searchParams.get("userId");
    const actionTypeFilter = searchParams.get("actionType");

    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);

    // Build where clause for activity logs
    const whereClause: any = {
      createdAt: {
        gte: from,
        lte: to,
      },
    };

    if (moduleFilter && moduleFilter !== "all") {
      whereClause.module = moduleFilter;
    }

    if (userIdFilter && userIdFilter !== "all") {
      whereClause.userId = userIdFilter;
    }

    if (actionTypeFilter && actionTypeFilter !== "all") {
      whereClause.action = actionTypeFilter;
    }

    // Fetch all activity logs in the date range
    const activityLogs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Debug: Log activity logs count
    console.log(`Found ${activityLogs.length} activity logs for date range ${from.toISOString()} to ${to.toISOString()}`);

    // Get all users for user activity reports (with admin identification)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        role: true,
        createdAt: true,
        adminId: true,
      },
    });

    // Calculate user activity reports (with tenant identification)
    const userActivityReports = allUsers.map((user) => {
      const userLogs = activityLogs.filter((log) => log.userId === user.id);
      const loginLogs = userLogs.filter((log) => 
        log.action?.toLowerCase().includes("login") || 
        log.action === "User Login"
      );
      const roleChangeLogs = userLogs.filter((log) => 
        log.action?.toLowerCase().includes("role") || 
        log.details?.toLowerCase().includes("role")
      );

      // Identify tenant (Admin) for this user
      let tenantInfo = null;
      if (user.role === UserRole.ADMIN && user.adminId === user.id) {
        // This is an Admin (tenant owner)
        tenantInfo = {
          adminId: user.id,
          adminName: user.name,
          adminEmail: user.email,
        };
      } else if (user.adminId) {
        // This user belongs to a tenant
        const admin = adminMap.get(user.adminId);
        if (admin) {
          tenantInfo = {
            adminId: admin.id,
            adminName: admin.name,
            adminEmail: admin.email,
          };
        }
      }

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        tenantInfo,
        loginCount: loginLogs.length,
        lastLogin: user.lastLogin?.toISOString() || user.createdAt.toISOString(),
        actionsPerformed: userLogs.length,
        roleChanges: roleChangeLogs.length,
      };
    });

    // Calculate permission change reports
    const permissionChangeReports = activityLogs
      .filter((log) => 
        log.action?.includes("Permission") || 
        log.action?.includes("permission") ||
        (log.action === "User Updated" && log.details?.includes("permission"))
      )
      .map((log) => {
        // Extract permission change details from log.details
        const details = log.details || "";
        const moduleMatch = Array.isArray(details.match(/module[:\s]+(\w+)/i)) 
          ? details.match(/module[:\s]+(\w+)/i) 
          : null;
        const moduleValue = moduleMatch ? moduleMatch[1] : log.module;
        const previousPermission = details.match(/previous[:\s]+(\w+)/i)?.[1] || "Unknown";
        const newPermission = details.match(/new[:\s]+(\w+)/i)?.[1] || "Unknown";
        
        return {
          id: log.id,
          userId: log.userId || "",
          userName: log.user?.name || "Unknown",
          userEmail: log.user?.email || "",
          module: moduleValue || "Unknown",
          previousPermission,
          newPermission,
          changedBy: "System", // Could be extracted from log details if stored
          changedAt: log.createdAt.toISOString(),
        };
      });

    // Calculate module usage reports
    const moduleUsageMap = new Map<string, { count: number; users: Set<string>; lastAccess: Date }>();
    
    activityLogs.forEach((log) => {
      if (log.module) {
        const existing = moduleUsageMap.get(log.module) || { count: 0, users: new Set<string>(), lastAccess: log.createdAt };
        existing.count += 1;
        if (log.userId) existing.users.add(log.userId);
        if (log.createdAt > existing.lastAccess) existing.lastAccess = log.createdAt;
        moduleUsageMap.set(log.module, existing);
      }
    });

    const moduleUsageReports = Array.from(moduleUsageMap.entries()).map(([module, data]) => ({
      module,
      accessCount: data.count,
      uniqueUsers: data.users.size,
      lastAccessed: data.lastAccess.toISOString(),
    })).sort((a, b) => b.accessCount - a.accessCount);

    // Audit logs (all activity logs with tenant identification)
    const auditLogs = activityLogs.map((log) => {
      // Identify tenant for the user who performed this action
      let tenantInfo = null;
      if (log.userId) {
        const user = allUsers.find(u => u.id === log.userId);
        if (user) {
          if (user.role === UserRole.ADMIN && user.adminId === user.id) {
            tenantInfo = {
              adminId: user.id,
              adminName: user.name,
              adminEmail: user.email,
            };
          } else if (user.adminId) {
            const admin = adminMap.get(user.adminId);
            if (admin) {
              tenantInfo = {
                adminId: admin.id,
                adminName: admin.name,
                adminEmail: admin.email,
              };
            }
          }
        }
      }

      return {
        id: log.id,
        action: log.action,
        module: log.module,
        details: log.details,
        userId: log.userId,
        userName: log.user?.name || null,
        tenantInfo,
        createdAt: log.createdAt.toISOString(),
      };
    });

    // Super Admin action reports (filter for Super Admin module or specific actions)
    const superAdminActionReports = activityLogs
      .filter((log) => 
        log.module === "Super Admin" || 
        log.action.includes("User") ||
        log.action.includes("Permission") ||
        log.action.includes("Role")
      )
      .map((log) => {
        // Extract affected user from details if available
        const details = log.details || "";
        const userMatch = details.match(/user[:\s]+([^,]+)/i);
        const affectedUser = userMatch?.[1] || log.user?.name || null;

        return {
          id: log.id,
          action: log.action,
          module: log.module,
          details: log.details,
          affectedUser,
          createdAt: log.createdAt.toISOString(),
        };
      });

    // Calculate summary statistics
    const allSuperAdminLogs = activityLogs.filter((log) => log.module === "Super Admin");
    const adminActions = new Map<string, number>();
    allSuperAdminLogs.forEach((log) => {
      if (log.user?.name) {
        adminActions.set(log.user.name, (adminActions.get(log.user.name) || 0) + 1);
      }
    });

    const mostActiveAdmin = Array.from(adminActions.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const moduleCounts = new Map<string, number>();
    activityLogs.forEach((log) => {
      if (log.module) {
        moduleCounts.set(log.module, (moduleCounts.get(log.module) || 0) + 1);
      }
    });

    const mostModifiedModule = Array.from(moduleCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const summary = {
      totalUsers: allUsers.length,
      totalActions: activityLogs.length,
      totalPermissionChanges: permissionChangeReports.length,
      totalModuleAccesses: moduleUsageReports.reduce((sum, r) => sum + r.accessCount, 0),
      mostActiveAdmin,
      mostModifiedModule,
    };

    // Debug logging
    console.log("Reports API Response:", {
      totalUsers: allUsers.length,
      totalActivityLogs: activityLogs.length,
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      userActivityReportsCount: userActivityReports.length,
      auditLogsCount: auditLogs.length,
    });

    return successResponse({
      userActivityReports,
      permissionChangeReports,
      moduleUsageReports,
      auditLogs,
      superAdminActionReports,
      summary,
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
