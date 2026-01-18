"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  inventoryFormSchema,
  inventoryUpdateSchema,
  type InventoryFormValues,
  type InventoryUpdateValues,
} from "@/lib/validations/inventory";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

export async function createInventoryItem(values: InventoryFormValues) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("inventory");
    if (permissionError) {
      return permissionError;
    }

    const parsed = inventoryFormSchema.parse(values);
    const adminId = await getTenantIdForCreate();

    await prisma.$transaction(
      parsed.entries.map((entry) =>
        prisma.inventoryItem.create({
          data: {
            cylinderType: entry.cylinderType,
            category: entry.category,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice ?? null,
            vendor: parsed.vendor,
            description: parsed.description ?? null,
            entryDate: parsed.entryDate,
            verified: parsed.verified ?? false,
            receivedBy: parsed.receivedBy,
            adminId,
          },
        }),
      ),
    );

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid inventory data." };
    }
    
    if (error?.code === "P2002") {
      return { success: false, error: "An inventory item with this data already exists." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to create inventory item." };
  }
}

export async function updateInventoryItem(id: string, values: InventoryUpdateValues) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("inventory");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid inventory item ID." };
    }

    const parsed = inventoryUpdateSchema.parse(values);

    // Check if inventory item exists
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, adminId: true },
    });

    if (!existing) {
      return { success: false, error: "Inventory item not found." };
    }

    // Verify access to this inventory item's tenant data
    if (!(await canAccessTenantData(existing.adminId))) {
      return { success: false, error: "You do not have permission to update this inventory item." };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        cylinderType: parsed.cylinderType,
        category: parsed.category,
        quantity: parsed.quantity,
        unitPrice: parsed.unitPrice ?? null,
        vendor: parsed.vendor,
        description: parsed.description ?? null,
        verified: parsed.verified ?? false,
        receivedBy: parsed.receivedBy,
        entryDate: parsed.entryDate,
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating inventory item:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid inventory data." };
    }
    
    if (error?.code === "P2025") {
      return { success: false, error: "Inventory item not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to update inventory item." };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("inventory");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid inventory item ID." };
    }

    // Check if inventory item exists
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, adminId: true },
    });

    if (!existing) {
      return { success: false, error: "Inventory item not found." };
    }

    // Verify access to this inventory item's tenant data
    if (!(await canAccessTenantData(existing.adminId))) {
      return { success: false, error: "You do not have permission to delete this inventory item." };
    }

    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting inventory item:", error);
    
    if (error?.code === "P2025") {
      return { success: false, error: "Inventory item not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to delete inventory item." };
  }
}

