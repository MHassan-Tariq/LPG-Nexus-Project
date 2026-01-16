"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function saveBillTemplateDesign(templateData: any) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Save the bill template design to the user's profile
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        billTemplateDesign: templateData,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "Bill template design saved successfully!" };
  } catch (error) {
    console.error("Error saving bill template design:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save bill template design",
    };
  }
}

export async function getBillTemplateDesign() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { billTemplateDesign: true },
    });

    return {
      success: true,
      data: user?.billTemplateDesign || null,
    };
  } catch (error) {
    console.error("Error fetching bill template design:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bill template design",
    };
  }
}

export async function saveReportTemplateDesign(templateData: any) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Save the report template design to the user's profile
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        reportTemplateDesign: templateData,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "Report template design saved successfully!" };
  } catch (error) {
    console.error("Error saving report template design:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save report template design",
    };
  }
}

export async function getReportTemplateDesign() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { reportTemplateDesign: true },
    });

    return {
      success: true,
      data: user?.reportTemplateDesign || null,
    };
  } catch (error) {
    console.error("Error fetching report template design:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch report template design",
    };
  }
}

export async function saveReportPreset(presetName: string, presetData: any) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!presetName || !presetName.trim()) {
      return { success: false, error: "Preset name is required." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { reportPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching user:", dbError);
      // If reportPresets field doesn't exist, try without select to see if user exists
      const userExists = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { id: true },
      });
      
      if (!userExists) {
        return { success: false, error: "User not found. Please log in again." };
      }
      
      // Field doesn't exist in database - return helpful error
      return { 
        success: false, 
        error: "Database schema needs to be updated. Please contact the administrator or restart the server." 
      };
    }

    const existingPresets = (user?.reportPresets as any) || { saved: [], history: [] };
    
    // Add to saved presets (no auto-delete, only manual deletion)
    const savedPresets = existingPresets.saved || [];
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      data: presetData,
      createdAt: new Date().toISOString(),
    };
    
    // Check if preset with same name exists, update it, otherwise add new
    const existingIndex = savedPresets.findIndex((p: any) => p.name === presetName);
    if (existingIndex >= 0) {
      savedPresets[existingIndex] = newPreset;
    } else {
      savedPresets.push(newPreset);
    }

    // Add to history (keep only last 5, auto-delete oldest when 6th is added)
    const history = existingPresets.history || [];
    history.push({
      id: `history-${Date.now()}`,
      name: presetName,
      data: presetData,
      createdAt: new Date().toISOString(),
    });
    
    // Keep only last 5 history entries
    const updatedHistory = history.slice(-5);

    try {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: {
          reportPresets: {
            saved: savedPresets,
            history: updatedHistory,
          },
        },
      });

      revalidatePath("/settings");
      return { success: true, message: "Preset saved successfully!" };
    } catch (updateError: any) {
      console.error("Error updating preset:", updateError);
      if (updateError.code === "P2009" || updateError.message?.includes("reportPresets")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error saving report preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save preset";
    
    // Provide user-friendly error messages
    if (errorMessage.includes("reportPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: false,
        error: "Database configuration error. Please restart the server or contact support.",
      };
    }
    
    return {
      success: false,
      error: errorMessage.includes("Unauthorized") 
        ? "You are not authorized to perform this action. Please log in again."
        : errorMessage || "Failed to save preset. Please try again.",
    };
  }
}

export async function getReportPresets() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { reportPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching presets:", dbError);
      // If field doesn't exist, return empty presets instead of error
      // This allows the UI to work while the schema is being updated
      if (dbError.message?.includes("reportPresets") || dbError.message?.includes("Unknown field")) {
        return {
          success: true,
          data: {
            saved: [],
            history: [],
          },
        };
      }
      throw dbError;
    }

    const presets = (user?.reportPresets as any) || { saved: [], history: [] };
    return {
      success: true,
      data: {
        saved: presets.saved || [],
        history: presets.history || [],
      },
    };
  } catch (error) {
    console.error("Error fetching report presets:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch presets";
    
    // Return empty presets on error to prevent UI breakage
    if (errorMessage.includes("reportPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: true,
        data: {
          saved: [],
          history: [],
        },
      };
    }
    
    return {
      success: false,
      error: errorMessage || "Failed to fetch presets. Please try again.",
    };
  }
}

export async function saveBillPreset(presetName: string, presetData: any) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!presetName || !presetName.trim()) {
      return { success: false, error: "Preset name is required." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { billPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching user:", dbError);
      const userExists = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { id: true },
      });
      
      if (!userExists) {
        return { success: false, error: "User not found. Please log in again." };
      }
      
      return { 
        success: false, 
        error: "Database schema needs to be updated. Please contact the administrator or restart the server." 
      };
    }

    const existingPresets = (user?.billPresets as any) || { saved: [], history: [] };
    
    const savedPresets = existingPresets.saved || [];
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      data: presetData,
      createdAt: new Date().toISOString(),
    };
    
    const existingIndex = savedPresets.findIndex((p: any) => p.name === presetName);
    if (existingIndex >= 0) {
      savedPresets[existingIndex] = newPreset;
    } else {
      savedPresets.push(newPreset);
    }

    const history = existingPresets.history || [];
    history.push({
      id: `history-${Date.now()}`,
      name: presetName,
      data: presetData,
      createdAt: new Date().toISOString(),
    });
    
    const updatedHistory = history.slice(-5);

    try {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: {
          billPresets: {
            saved: savedPresets,
            history: updatedHistory,
          },
        },
      });

      revalidatePath("/settings");
      return { success: true, message: "Preset saved successfully!" };
    } catch (updateError: any) {
      console.error("Error updating preset:", updateError);
      if (updateError.code === "P2009" || updateError.message?.includes("billPresets")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error saving bill preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save preset";
    
    if (errorMessage.includes("billPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: false,
        error: "Database configuration error. Please restart the server or contact support.",
      };
    }
    
    return {
      success: false,
      error: errorMessage.includes("Unauthorized") 
        ? "You are not authorized to perform this action. Please log in again."
        : errorMessage || "Failed to save preset. Please try again.",
    };
  }
}

export async function getBillPresets() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { billPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching presets:", dbError);
      if (dbError.message?.includes("billPresets") || dbError.message?.includes("Unknown field")) {
        return {
          success: true,
          data: {
            saved: [],
            history: [],
          },
        };
      }
      throw dbError;
    }

    const presets = (user?.billPresets as any) || { saved: [], history: [] };
    return {
      success: true,
      data: {
        saved: presets.saved || [],
        history: presets.history || [],
      },
    };
  } catch (error) {
    console.error("Error fetching bill presets:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch presets";
    
    if (errorMessage.includes("billPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: true,
        data: {
          saved: [],
          history: [],
        },
      };
    }
    
    return {
      success: false,
      error: errorMessage || "Failed to fetch presets. Please try again.",
    };
  }
}

export async function deleteBillPreset(presetId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!presetId || !presetId.trim()) {
      return { success: false, error: "Preset ID is required." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { billPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching user for deletion:", dbError);
      if (dbError.message?.includes("billPresets") || dbError.message?.includes("Unknown field")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw dbError;
    }

    const existingPresets = (user?.billPresets as any) || { saved: [], history: [] };
    const savedPresets = (existingPresets.saved || []).filter((p: any) => p.id !== presetId);

    if (savedPresets.length === (existingPresets.saved || []).length) {
      return { success: false, error: "Preset not found. It may have already been deleted." };
    }

    try {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: {
          billPresets: {
            saved: savedPresets,
            history: existingPresets.history || [],
          },
        },
      });

      revalidatePath("/settings");
      return { success: true, message: "Preset deleted successfully!" };
    } catch (updateError: any) {
      console.error("Error updating preset:", updateError);
      if (updateError.code === "P2009" || updateError.message?.includes("billPresets")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error deleting bill preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete preset";
    
    if (errorMessage.includes("billPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: false,
        error: "Database configuration error. Please restart the server or contact support.",
      };
    }
    
    return {
      success: false,
      error: errorMessage.includes("Unauthorized") 
        ? "You are not authorized to perform this action. Please log in again."
        : errorMessage || "Failed to delete preset. Please try again.",
    };
  }
}

export async function deleteReportPreset(presetId: string) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    if (!presetId || !presetId.trim()) {
      return { success: false, error: "Preset ID is required." };
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { reportPresets: true },
      });
    } catch (dbError: any) {
      console.error("Database error fetching user for deletion:", dbError);
      if (dbError.message?.includes("reportPresets") || dbError.message?.includes("Unknown field")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw dbError;
    }

    const existingPresets = (user?.reportPresets as any) || { saved: [], history: [] };
    const savedPresets = (existingPresets.saved || []).filter((p: any) => p.id !== presetId);

    // Check if preset was actually found
    if (savedPresets.length === (existingPresets.saved || []).length) {
      return { success: false, error: "Preset not found. It may have already been deleted." };
    }

    try {
      await prisma.user.update({
        where: { id: currentUser.userId },
        data: {
          reportPresets: {
            saved: savedPresets,
            history: existingPresets.history || [],
          },
        },
      });

      revalidatePath("/settings");
      return { success: true, message: "Preset deleted successfully!" };
    } catch (updateError: any) {
      console.error("Error updating preset:", updateError);
      if (updateError.code === "P2009" || updateError.message?.includes("reportPresets")) {
        return { 
          success: false, 
          error: "Database schema needs to be updated. Please restart the server or contact the administrator." 
        };
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error deleting report preset:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete preset";
    
    if (errorMessage.includes("reportPresets") || errorMessage.includes("Unknown field")) {
      return {
        success: false,
        error: "Database configuration error. Please restart the server or contact support.",
      };
    }
    
    return {
      success: false,
      error: errorMessage.includes("Unauthorized") 
        ? "You are not authorized to perform this action. Please log in again."
        : errorMessage || "Failed to delete preset. Please try again.",
    };
  }
}

