"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

interface UpdateProfileData {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  profileImage?: string | null;
  companyDescription?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
}

export async function updateProfile(data: UpdateProfileData) {
  try {
    // Get current user to verify they can only update their own profile
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "You must be logged in to update your profile." };
    }

    // Users can only update their own profile (unless they're SUPER_ADMIN)
    if (currentUser.userId !== data.id && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, error: "You can only update your own profile." };
    }

    if (!data.id || typeof data.id !== "string") {
      return { success: false, error: "Invalid user ID." };
    }

    // Map form role values to database enum values
    const roleMap: Record<string, string> = {
      "Admin": "ADMIN",
      "Manager": "STAFF", // Manager maps to STAFF
      "Viewer": "VIEWER",
    };
    const dbRole = roleMap[data.role] || data.role.toUpperCase();

    console.log("Updating profile:", {
      userId: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      dbRole: dbRole,
      hasImage: !!data.profileImage,
    });

    await prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        username: data.username || null,
        email: data.email,
        phone: data.phone || null,
        role: dbRole as any, // Cast to any since Prisma will validate
        department: data.department || null,
        profileImage: data.profileImage || null,
        companyDescription: data.companyDescription || null,
        streetAddress: data.streetAddress || null,
        city: data.city || null,
        stateProvince: data.stateProvince || null,
        country: data.country || null,
      },
    });

    console.log("Profile updated successfully");
    revalidatePath("/profile");
    revalidatePath("/"); // Also revalidate dashboard to update topbar
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });
    
    if (error?.code === "P2025") {
      return { success: false, error: "User not found." };
    }
    
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "field";
      return { success: false, error: `${field} already exists. Please use a different value.` };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to update profile. Please try again." };
  }
}

interface ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(data: ChangePasswordData) {
  try {
    // Get current user to verify they can only change their own password
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "You must be logged in to change your password." };
    }

    // Users can only change their own password
    if (currentUser.userId !== data.userId && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, error: "You can only change your own password." };
    }

    if (!data.userId || typeof data.userId !== "string") {
      return { success: false, error: "Invalid user ID." };
    }
    // In a real application, you would:
    // 1. Verify the current password hash matches
    // 2. Hash the new password using bcrypt or similar
    // 3. Update the passwordHash field

    // For now, this is a mock implementation
    // You should implement proper password hashing and verification
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Implement actual password verification and hashing
    // if (!user.passwordHash || !(await verifyPassword(data.currentPassword, user.passwordHash))) {
    //   throw new Error("Current password is incorrect");
    // }

    // const hashedPassword = await hashPassword(data.newPassword);
    // await prisma.user.update({
    //   where: { id: data.userId },
    //   data: { passwordHash: hashedPassword },
    // });

    // For demo purposes, we'll just return success
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to change password");
  }
}

