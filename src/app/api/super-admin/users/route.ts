export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/jwt";
import { getCurrentAdminId, isSuperAdmin } from "@/lib/tenant-utils";
// Core utilities
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";
import { buildTextSearchFilter } from "@/core/data/search";
import { createUnauthorizedResponse, createNotFoundResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse, createdResponse, paginatedResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated and get their role
    const currentLoggedInUser = await getCurrentUser();
    if (!currentLoggedInUser) {
      return createUnauthorizedResponse();
    }

    const loggedInUserData = await prisma.user.findUnique({
      where: { id: currentLoggedInUser.userId },
      select: { role: true },
    });

    if (!loggedInUserData) {
      return createNotFoundResponse("User");
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    
    // Parse pagination using core utility
    const pagination = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationSkipTake(pagination.page, pagination.pageSize);

    const where: any = {};
    
    // Apply role filter if specified and not "all"
    if (role && role !== "all") {
      const roleValue = role as UserRole;
      // If ADMIN is filtering, ensure they still can't see SUPER_ADMIN
      if (loggedInUserData.role === UserRole.ADMIN && roleValue === UserRole.SUPER_ADMIN) {
        // ADMIN trying to filter by SUPER_ADMIN - return empty result
        return successResponse({ users: [] });
      }
      // Apply role filter normally
      where.role = roleValue;
    }
    
    // Only SUPER_ADMIN can access users list
    if (loggedInUserData.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("Unauthorized. Only Super Admins can access user management.");
    }
    
    if (status && status !== "all") {
      where.status = status as UserStatus;
    }

    // Build search filter using core utility
    const searchFilter = buildTextSearchFilter(
      pagination.q || searchParams.get("search") || undefined,
      ["name", "email", "phone", "businessName"]
    );
    
    if (searchFilter) {
      where.OR = searchFilter.OR;
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: take ? skip : undefined,
      take: take || undefined,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        businessName: true,
        branch: true,
        profileImage: true,
        permissions: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Get delivery counts for each user
    const usersWithDeliveries = await Promise.all(
      users.map(async (user) => {
        const deliveryCount = await prisma.cylinderTransaction.count({
          where: {
            userId: user.id,
            type: "ISSUE",
          },
        });
        return {
          ...user,
          totalDeliveries: deliveryCount,
        };
      })
    );

    if (take) {
      return paginatedResponse(usersWithDeliveries, pagination.page, pagination.pageSize, total);
    }

    return successResponse({ users: usersWithDeliveries });
  } catch (error) {
    console.error("Error fetching users:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const currentLoggedInUser = await getCurrentUser();
    if (!currentLoggedInUser) {
      return createUnauthorizedResponse();
    }

    const loggedInUserData = await prisma.user.findUnique({
      where: { id: currentLoggedInUser.userId },
      select: { role: true },
    });

    if (!loggedInUserData) {
      return createNotFoundResponse("User");
    }

    const body = await request.json();
    const { name, email, phone, businessName, branch, role, status } = body;

    if (!name || !email) {
      return createErrorResponse("Name and email are required", 400);
    }

    // Prevent non-SUPER_ADMIN from creating SUPER_ADMIN users
    if (role && role.toUpperCase() === UserRole.SUPER_ADMIN && loggedInUserData.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("You do not have permission to create Super Admin accounts. Only Super Admins can create Super Admin accounts.");
    }

    // Validate and normalize role and status values
    const validRoles = Object.values(UserRole);
    const validStatuses = Object.values(UserStatus);
    
    // Normalize role value (handle case-insensitive and common variations)
    let normalizedRole = role;
    if (role) {
      const roleUpper = role.toUpperCase();
      // Map common variations to correct enum values
      if (roleUpper === "SUPERADMIN" || roleUpper === "SUPER_ADMIN") {
        normalizedRole = UserRole.SUPER_ADMIN;
      } else if (roleUpper === "BRANCHMANAGER" || roleUpper === "BRANCH_MANAGER") {
        normalizedRole = UserRole.BRANCH_MANAGER;
      } else {
        normalizedRole = roleUpper as UserRole;
      }
    }
    
    const userRole = (normalizedRole && validRoles.includes(normalizedRole as UserRole)) 
      ? (normalizedRole as UserRole) 
      : UserRole.STAFF;
    
    const userStatus = (status && validStatuses.includes(status as UserStatus))
      ? (status as UserStatus)
      : UserStatus.ACTIVE;

    // Determine adminId based on role and who is creating
    let adminId: string | null = null;
    if (userRole === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN has no adminId (system-level)
      adminId = null;
    } else if (userRole === UserRole.ADMIN) {
      // ADMIN users have adminId = their own id (self-reference, set after creation)
      adminId = null; // Will be set after creation
    } else {
      // STAFF, VIEWER, BRANCH_MANAGER belong to the Admin who created them
      if (loggedInUserData.role === UserRole.ADMIN) {
        // Admin creating users - assign to themselves
        adminId = currentLoggedInUser.userId;
      } else if (loggedInUserData.role === UserRole.SUPER_ADMIN) {
        // Super Admin creating non-Admin users - require adminId parameter
        const requestedAdminId = body.adminId;
        if (requestedAdminId) {
          // Verify the requested adminId is actually an ADMIN user
          const adminUser = await prisma.user.findUnique({
            where: { id: requestedAdminId },
            select: { role: true },
          });
          if (adminUser && adminUser.role === UserRole.ADMIN) {
            adminId = requestedAdminId;
          } else {
            return createErrorResponse("Invalid adminId. The specified user must be an ADMIN.", 400);
          }
        } else {
          return createErrorResponse("adminId is required when Super Admin creates non-Admin users. Please specify which Admin this user belongs to.", 400);
        }
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        businessName: businessName || null,
        branch: branch || null,
        role: userRole,
        status: userStatus,
        permissions: {}, // Default empty permissions
        adminId,
      },
    });

    // If this is an ADMIN user, set adminId to self-reference
    if (userRole === UserRole.ADMIN && user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { adminId: user.id },
      });
    }

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: currentLoggedInUser.userId,
          action: "User Created",
          module: "Super Admin",
          details: `Created user: ${name} (${email}) with role ${userRole}`,
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error("Failed to log activity:", logError);
    }

    return createdResponse({ user });
  } catch (error: any) {
    if (error.code === "P2002") {
      return createErrorResponse("Email already exists", 400);
    }
    console.error("Error creating user:", error);
    return createErrorResponse(
      error?.message || "Internal server error",
      500
    );
  }
}

