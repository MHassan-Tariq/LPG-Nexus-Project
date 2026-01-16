"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { issueOtp, verifyOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
import { setAuthToken, clearAuthToken } from "@/lib/jwt";
import { UserRole, UserStatus } from "@prisma/client";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  businessName: z.string().min(2),
  username: z.string().min(2),
  isSuperAdmin: z.boolean().optional(),
  password: z.string().min(8),
});

export async function login(values: z.infer<typeof loginSchema>) {
  try {
    // Validate input
    const parsed = loginSchema.parse(values);

    // Find user by username (username is now unique)
    // Include adminId in query for multi-tenant support
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { username: parsed.username },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          passwordHash: true,
          status: true,
          isVerified: true,
          adminId: true, // Include adminId for tenant calculation
        },
      });
    } catch (dbError: any) {
      console.error("Database error during login:", dbError);
      
      // Handle specific Prisma errors
      if (dbError.code === "P1001" || dbError.code === "P1017") {
        return {
          success: false,
          error: "Database connection error. Please try again in a moment.",
        };
      }
      
      return {
        success: false,
        error: "Unable to connect to the server. Please check your internet connection and try again.",
      };
    }

    if (!user) {
      return { success: false, error: "Username not found" };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        error: "Account setup incomplete. Please contact support.",
      };
    }

    // Check if account is suspended
    if (user.status === UserStatus.SUSPENDED) {
      return {
        success: false,
        error: "Your account has been suspended. Please contact support.",
      };
    }
    
    // Check if account is verified
    // Handle both undefined/null and false cases
    if (user.isVerified === false || user.isVerified === null || user.isVerified === undefined) {
      return {
        success: false,
        error: "Account not verified. Please contact support.",
      };
    }

    // Verify password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
    } catch (bcryptError) {
      console.error("Password verification error:", bcryptError);
      return {
        success: false,
        error: "Password verification failed. Please try again.",
      };
    }

    if (!isPasswordValid) {
      return { success: false, error: "Password not correct" };
    }

    // Calculate adminId for JWT
    // SUPER_ADMIN: adminId = null
    // ADMIN: adminId = their own id (they own their tenant)
    // STAFF/VIEWER/BRANCH_MANAGER: adminId = their adminId (their Admin's id)
    let adminId: string | null = null;
    if (user.role === UserRole.SUPER_ADMIN) {
      adminId = null;
    } else if (user.role === UserRole.ADMIN) {
      adminId = user.id; // Admin owns their tenant
    } else {
      adminId = user.adminId; // Staff/Viewer/BranchManager belong to their Admin
    }

    // Create JWT token and set in cookie
    try {
    await setAuthToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        adminId: adminId,
      },
      parsed.rememberMe || false,
    );
    } catch (tokenError) {
      console.error("Token creation error:", tokenError);
      return {
        success: false,
        error: "Failed to create session. Please try again.",
      };
    }

    return {
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    };
  } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const field = firstError?.path[0];
        if (field === "username") {
          return {
            success: false,
            error: "Username is required",
          };
        }
        if (field === "password") {
          return {
            success: false,
            error: "Password is required",
          };
        }
        return {
          success: false,
          error: firstError?.message || "Please check your input.",
        };
      }

      // Handle other errors
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      // Provide user-friendly messages for common errors
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
        return {
          success: false,
          error: "Connection failed. Please check your internet and try again.",
        };
      }

      return {
        success: false,
        error: "Login failed. Please try again.",
      };
  }
}

export async function register(values: z.infer<typeof registerSchema>) {
  try {
    // Validate input
    const parsed = registerSchema.parse(values);

    // Check if user already exists by email
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    } catch (dbError: any) {
      console.error("Database error checking email:", dbError);
      
      if (dbError.code === "P1001" || dbError.code === "P1017") {
        return {
          success: false,
          error: "Database connection error. Please try again in a moment.",
        };
      }
      
      return {
        success: false,
        error: "Unable to connect to the server. Please check your internet connection and try again.",
      };
    }

    if (existingUser) {
      return {
        success: false,
        error: "Email already exists. Please use a different email.",
      };
    }

    // Check if username already exists (if provided)
    if (parsed.username) {
      let existingUsername;
      try {
        existingUsername = await prisma.user.findFirst({
          where: { username: parsed.username },
        });
      } catch (dbError: any) {
        console.error("Database error checking username:", dbError);
        return {
          success: false,
          error: "Unable to verify username. Please try again.",
        };
      }

      if (existingUsername) {
        return {
          success: false,
          error: "Username already taken. Please choose another username.",
        };
      }
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(parsed.password, 10);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return {
        success: false,
        error: "Failed to process password. Please try again.",
      };
    }

    // Determine role based on isSuperAdmin flag
    const userRole = parsed.isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.ADMIN;

    // Create user with all required and optional fields
    // Note: For ADMIN users, we'll set adminId to their own id after creation (self-reference)
    let user;
    try {
      user = await prisma.user.create({
      data: {
          name: parsed.fullName.trim(),
          email: parsed.email.trim().toLowerCase(),
          phone: parsed.phone.trim(),
        passwordHash: passwordHash,
        role: userRole,
          businessName: parsed.businessName.trim(),
          username: parsed.username.trim(),
          status: "ACTIVE",
          adminId: userRole === UserRole.SUPER_ADMIN ? null : null, // Will update for ADMIN after creation
      },
    });

    // For ADMIN users: set adminId to their own id (self-reference, they own their tenant)
    if (userRole === UserRole.ADMIN) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { adminId: user.id },
      });
    }
    } catch (createError: any) {
      console.error("User creation error:", createError);
      
      // Handle Prisma unique constraint violations
      if (createError.code === "P2002") {
        const field = createError.meta?.target?.[0];
        if (field === "email") {
          return {
            success: false,
            error: "Email already exists. Please use a different email.",
          };
        }
        if (field === "username") {
          return {
            success: false,
            error: "Username already taken. Please choose another username.",
          };
        }
        return {
          success: false,
          error: "Information already in use. Please check your details.",
        };
      }
      
      // Handle other Prisma errors
      if (createError.code === "P1001" || createError.code === "P1017") {
        return {
          success: false,
          error: "Database connection error. Please try again in a moment.",
        };
      }
      
      if (createError.code === "P2003") {
        return {
          success: false,
          error: "Invalid data provided. Please check all fields and try again.",
        };
      }

      return {
        success: false,
        error: "Failed to create account. Please try again. If the problem persists, contact support.",
      };
    }

    return { success: true, userId: user.id };
  } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const field = firstError?.path[0];
        if (field === "fullName") {
          return {
            success: false,
            error: "Full name must be at least 2 characters",
          };
        }
        if (field === "email") {
          return {
            success: false,
            error: "Please enter a valid email address",
          };
        }
        if (field === "username") {
          return {
            success: false,
            error: "Username must be at least 2 characters",
          };
        }
        if (field === "password") {
          return {
            success: false,
            error: "Password must be at least 8 characters",
          };
        }
        if (field === "phone") {
          return {
            success: false,
            error: "Phone number must be at least 10 digits",
          };
        }
        return {
          success: false,
          error: firstError?.message || "Please check your input.",
        };
      }

      // Handle other errors
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      // Provide user-friendly messages for common errors
      if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("timeout")) {
        return {
          success: false,
          error: "Connection failed. Please check your internet and try again.",
        };
      }

      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return { success: true, message: "If an account exists, a password reset link has been sent" };
    }

    // Generate and send OTP
    const { code, expiresAt } = await issueOtp(email);
    const emailResult = await sendOtpEmail(email, code, user.username);

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Failed to send password reset code. Email service may not be configured.",
      };
    }

    return { success: true, message: "Password reset code sent to your email" };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send password reset code",
    };
  }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  try {
    // Verify OTP first
    const verificationResult = await verifyOtp(email, code);

    if (!verificationResult.valid) {
      return { success: false, error: "Invalid or expired reset code" };
    }

    // Validate password length
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}

export async function logout() {
  await clearAuthToken();
  redirect("/login");
}

