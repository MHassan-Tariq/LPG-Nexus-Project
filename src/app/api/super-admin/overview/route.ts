import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { UserRole } from "@prisma/client";
import { isSuperAdmin } from "@/lib/tenant-utils";
// Core utilities
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";
import { createUnauthorizedResponse, createNotFoundResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    // Only SUPER_ADMIN can access this endpoint
    if (!(await isSuperAdmin())) {
      return createForbiddenResponse("Forbidden. Only Super Admins can access this data.");
    }

    // Get pagination parameters using core utility
    const { searchParams } = new URL(request.url);
    const activityPage = parseInt(searchParams.get("activityPage") || "1", 10);
    const activityPageSize = parseInt(searchParams.get("activityPageSize") || "5", 10);
    const { skip: activitySkip, take: activityTake } = getPaginationSkipTake(activityPage, activityPageSize);

    // Get all Admin users (tenants)
    const adminUsers = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Get tenant statistics for each Admin
    const tenantStats = await Promise.all(
      adminUsers.map(async (admin) => {
        const [
          customers,
          cylinderEntries,
          bills,
          payments,
          expenses,
          inventoryItems,
        ] = await Promise.all([
          prisma.customer.count({ where: { adminId: admin.id } }),
          prisma.cylinderEntry.count({ where: { adminId: admin.id } }),
          prisma.bill.count({ where: { adminId: admin.id } }),
          prisma.payment.count({ where: { adminId: admin.id } }),
          prisma.expense.count({ where: { adminId: admin.id } }),
          prisma.inventoryItem.count({ where: { adminId: admin.id } }),
        ]);

        return {
          adminId: admin.id,
          adminName: admin.name,
          adminEmail: admin.email,
          adminCreatedAt: admin.createdAt,
          customers,
          cylinderEntries,
          bills,
          payments,
          expenses,
          inventoryItems,
        };
      })
    );

    // Get statistics (all users, not filtered by tenant)
    const [totalUsers, verifiedUsers, unverifiedUsers, totalAdmins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
    ]);

    // Get recent activity with pagination
    const [activities, activityTotal] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: activitySkip,
        take: activityTake,
      }),
      prisma.activityLog.count(),
    ]);

    const recentActivity = activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      module: activity.module || null,
      details: activity.details || null,
      createdAt: activity.createdAt,
    }));

    return successResponse({
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        totalAdmins,
      },
      tenantStats,
      recentActivity,
      activityPagination: {
        page: activityPage,
        pageSize: activityPageSize,
        total: activityTotal,
        totalPages: Math.ceil(activityTotal / activityPageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

