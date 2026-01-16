"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getSystemSettingsAdminId } from "@/lib/tenant-utils";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

const settingsSchema = z.object({
  softwareName: z.string().min(1, "Software name is required").max(100, "Software name is too long"),
  softwareLogo: z.string().nullable().optional(),
});

export async function saveSettings(values: z.infer<typeof settingsSchema>) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("settings");
    if (permissionError) {
      return permissionError;
    }
    console.log("saveSettings called with:", {
      softwareName: values.softwareName,
      hasLogo: !!values.softwareLogo,
      logoLength: values.softwareLogo?.length || 0,
    });

    const parsed = settingsSchema.parse(values);
    const adminId = await getSystemSettingsAdminId();

    // Upsert software name (with tenant filter)
    const nameResult = await prisma.systemSettings.upsert({
      where: {
        adminId_key: {
          adminId: adminId,
          key: "softwareName",
        },
      },
      update: { value: parsed.softwareName.trim() },
      create: {
        key: "softwareName",
        value: parsed.softwareName.trim(),
        adminId: adminId,
      },
    });
    console.log("Software name saved:", nameResult);

    // Upsert software logo - save it (can be null/empty to clear) (with tenant filter)
    const logoValue = parsed.softwareLogo;
    // If logoValue is null, it means clear the logo (save empty string)
    // If logoValue is a string (even empty), save it as-is
    const logoValueToSave = logoValue === null ? "" : (logoValue || "");
    
    console.log("Saving logo:", {
      adminId,
      hasLogo: !!logoValue,
      logoLength: logoValue?.length || 0,
      willSave: logoValueToSave.length > 0 ? "yes" : "no (clearing)",
    });
    
    const logoResult = await prisma.systemSettings.upsert({
      where: {
        adminId_key: {
          adminId: adminId,
          key: "softwareLogo",
        },
      },
      update: { value: logoValueToSave },
      create: {
        key: "softwareLogo",
        value: logoValueToSave,
        adminId: adminId,
      },
    });
    console.log("Software logo saved:", {
      success: !!logoResult,
      id: logoResult?.id,
      valueLength: logoResult?.value?.length || 0,
    });

    // Revalidate all pages that use the software name
    revalidatePath("/settings");
    revalidatePath("/");
    revalidatePath("/", "layout"); // Revalidate layout to update sidebar

    return { success: true, message: "Settings saved successfully!" };
  } catch (error: any) {
    console.error("Error saving settings:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid settings data." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to save settings. Please try again.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

