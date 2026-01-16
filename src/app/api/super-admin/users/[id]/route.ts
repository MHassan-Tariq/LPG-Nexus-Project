import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/jwt";
// Core utilities
import { createUnauthorizedResponse, createNotFoundResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated
    const currentLoggedInUser = await getCurrentUser();
    if (!currentLoggedInUser) {
      return createUnauthorizedResponse();
    }

    // Get current logged-in user's role
    const loggedInUserData = await prisma.user.findUnique({
      where: { id: currentLoggedInUser.userId },
      select: { role: true },
    });

    if (!loggedInUserData) {
      return createNotFoundResponse("User");
    }

    // Get the target user
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        department: true,
        profileImage: true,
        streetAddress: true,
        city: true,
        stateProvince: true,
        country: true,
        companyDescription: true,
        permissions: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    // Only SUPER_ADMIN can access user details
    if (loggedInUserData.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("Unauthorized. Only Super Admins can access user management.");
    }

    // Get delivery count
    const totalDeliveries = await prisma.cylinderTransaction.count({
      where: {
        userId: user.id,
        type: "ISSUE",
      },
    });

    // If this user is an ADMIN, get all tenant users (users created by this admin)
    let tenantUsers = [];
    if (user.role === UserRole.ADMIN) {
      tenantUsers = await prisma.user.findMany({
        where: {
          adminId: user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          role: true,
          status: true,
          isVerified: true,
          profileImage: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return successResponse({ 
      user: {
        ...user,
        totalDeliveries,
      },
      tenantUsers: tenantUsers || [],
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated
    const currentLoggedInUser = await getCurrentUser();
    if (!currentLoggedInUser) {
      return createUnauthorizedResponse();
    }

    // Get current logged-in user's full data
    const loggedInUserData = await prisma.user.findUnique({
      where: { id: currentLoggedInUser.userId },
      select: { role: true },
    });

    if (!loggedInUserData) {
      return createNotFoundResponse("User");
    }

    // Get the target user being updated
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, role: true },
    });

    if (!targetUser) {
      return createNotFoundResponse("User");
    }

    // Prevent ADMIN from modifying SUPER_ADMIN users
    if (loggedInUserData.role === UserRole.ADMIN && targetUser.role === UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("You do not have permission to modify Super Admin accounts. Only Super Admins can manage Super Admin accounts.");
    }

    // Get request body
    const body = await request.json();
    const { name, email, phone, businessName, branch, role, status, isVerified, permissions } = body;

    // Prevent non-SUPER_ADMIN from changing a user's role to SUPER_ADMIN
    if (role && role === UserRole.SUPER_ADMIN && loggedInUserData.role !== UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("You do not have permission to assign Super Admin role. Only Super Admins can create or assign Super Admin accounts.");
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(businessName !== undefined && { businessName }),
        ...(branch !== undefined && { branch }),
        ...(role && { role: role as UserRole }),
        ...(status && { status: status as UserStatus }),
        ...(isVerified !== undefined && { isVerified }),
        ...(permissions !== undefined && { permissions }),
      },
    });

    // Log the activity
    try {
      const changes = [];
      if (name && name !== targetUser?.name) changes.push(`name to ${name}`);
      if (role) changes.push(`role to ${role}`);
      if (status) changes.push(`status to ${status}`);
      if (permissions !== undefined) changes.push("permissions");

      await prisma.activityLog.create({
        data: {
          userId: currentLoggedInUser.userId,
          action: "User Updated",
          module: "Super Admin",
          details: `Updated user: ${targetUser?.name || params.id} - Changed ${changes.join(", ")}`,
        },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return successResponse({ user });
  } catch (error: any) {
    if (error.code === "P2025") {
      return createNotFoundResponse("User");
    }
    if (error.code === "P2002") {
      // Unique constraint violation (likely email)
      const target = error.meta?.target?.[0];
      if (target === "email") {
        return createErrorResponse("Email already exists. Please use a different email address.", 400);
      }
      return createErrorResponse("A user with this information already exists.", 400);
    }
    console.error("Error updating user:", error);
    return createErrorResponse(error?.message || "Internal server error", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is authenticated
    const currentLoggedInUser = await getCurrentUser();
    if (!currentLoggedInUser) {
      return createUnauthorizedResponse();
    }

    // Get current logged-in user's full data
    const loggedInUserData = await prisma.user.findUnique({
      where: { id: currentLoggedInUser.userId },
      select: { role: true },
    });

    if (!loggedInUserData) {
      return createNotFoundResponse("User");
    }

    // Get user data before deleting for logging
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, role: true },
    });

    if (!user) {
      return createNotFoundResponse("User");
    }

    // Prevent ADMIN from deleting SUPER_ADMIN users
    if (loggedInUserData.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN) {
      return createForbiddenResponse("You do not have permission to delete Super Admin accounts. Only Super Admins can delete Super Admin accounts.");
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: currentLoggedInUser.userId,
          action: "User Deleted",
          module: "Super Admin",
          details: `Deleted user: ${user?.name || params.id} (${user?.email || "unknown email"})`,
        },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return successResponse({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return createNotFoundResponse("User");
    }
    console.error("Error deleting user:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

