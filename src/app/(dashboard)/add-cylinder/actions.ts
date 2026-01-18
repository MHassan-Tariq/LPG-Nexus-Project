"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CylinderFormValues } from "@/components/add-cylinder/cylinder-form";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

export async function updateCylinderEntry(id: string, values: CylinderFormValues) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("addCylinder");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid cylinder entry ID." };
    }

    // Verify access to this entry's tenant data
    const existingEntry = await prisma.cylinderEntry.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!existingEntry) {
      return { success: false, error: "Cylinder entry not found." };
    }

    if (!(await canAccessTenantData(existingEntry.adminId))) {
      return { success: false, error: "You do not have permission to update this cylinder entry." };
    }

    // For RECEIVED type: use emptyCylinderReceived as quantity, otherwise use quantity
    const quantity = values.cylinderType === "RECEIVED" 
      ? (values.emptyCylinderReceived ?? 0)
      : (values.quantity ?? 0);

    // Calculate total amount only for DELIVERED type
    const totalAmount = values.cylinderType === "DELIVERED" && values.unitPrice && values.quantity
      ? values.unitPrice * values.quantity
      : values.amount ?? 0;

    // Extract customer ID from customerName (format: "4 · Arham" or just "Arham")
    let customerId: string | null = null;
    let customerNameOnly = values.customerName;
    if (values.customerName) {
      // Check if customerName contains " · " (customer code separator)
      if (values.customerName.includes(" · ")) {
        const customerCode = parseInt(values.customerName.split(" · ")[0]);
        customerNameOnly = values.customerName.split(" · ")[1];
        // Find customer by code and name (with tenant filter)
        const tenantFilter = await getTenantFilter();
        const customer = await prisma.customer.findFirst({
          where: {
            ...tenantFilter,
            customerCode: customerCode,
            name: customerNameOnly,
          },
          select: { id: true },
        });
        customerId = customer?.id || null;
      } else {
        // If no separator, try to find by name only (with tenant filter)
        const tenantFilter = await getTenantFilter();
        const customer = await prisma.customer.findFirst({
          where: {
            ...tenantFilter,
            name: values.customerName,
          },
          select: { id: true },
        });
        customerId = customer?.id || null;
      }
    }

    // Validate RECEIVED entries: cannot receive more than delivered
    if (values.cylinderType === "RECEIVED" && values.emptyCylinderReceived) {
      // Get the current entry to exclude it from the received total
      const currentEntry = await prisma.cylinderEntry.findUnique({
        where: { id },
        select: { quantity: true },
      });

      // Calculate total delivered for this customer (with tenant filter)
      const tenantFilter = await getTenantFilter();
      const totalDelivered = await prisma.cylinderEntry.aggregate({
        where: {
          ...tenantFilter,
          cylinderType: "DELIVERED",
          customerName: customerNameOnly,
        },
        _sum: {
          quantity: true,
        },
      });

      // Calculate total received for this customer (excluding current entry, with tenant filter)
      const totalReceived = await prisma.cylinderEntry.aggregate({
        where: {
          ...tenantFilter,
          cylinderType: "RECEIVED",
          customerName: customerNameOnly,
          NOT: { id }, // Exclude current entry
        },
        _sum: {
          quantity: true,
        },
      });

      const deliveredQty = totalDelivered._sum.quantity ?? 0;
      const receivedQty = totalReceived._sum.quantity ?? 0;
      const newReceivedQty = values.emptyCylinderReceived;
      const totalAfterThisUpdate = receivedQty + newReceivedQty;

      if (totalAfterThisUpdate > deliveredQty) {
        return {
          success: false,
          error: `Cannot receive ${newReceivedQty} cylinders. Total received (${totalAfterThisUpdate}) cannot exceed total delivered (${deliveredQty}).`,
        };
      }
    }

    // adminId should already be set, but we keep it for consistency
    await prisma.cylinderEntry.update({
      where: { id },
      data: {
        billCreatedBy: values.billCreatedBy,
        cylinderType: values.cylinderType,
        cylinderLabel: values.cylinderLabel,
        deliveredBy: values.deliveredBy || null,
        unitPrice: values.unitPrice ?? 0,
        quantity: quantity,
        amount: totalAmount,
        customerName: values.customerName,
        customerId: customerId,
        verified: values.verified,
        description: values.description || null,
        deliveryDate: values.deliveryDate,
        // New fields for RECEIVED type - convert empty strings to null
        paymentType: values.paymentType || null,
        paymentAmount: values.paymentAmount && values.paymentAmount > 0 ? values.paymentAmount : null,
        paymentReceivedBy: values.paymentReceivedBy && values.paymentReceivedBy.trim() ? values.paymentReceivedBy : null,
        emptyCylinderReceived: values.emptyCylinderReceived && values.emptyCylinderReceived > 0 ? values.emptyCylinderReceived : null,
      },
    });

    revalidatePath("/add-cylinder", "page");
    
    // Auto-sync bills for this customer when DELIVERED entry is updated
    if (values.cylinderType === "DELIVERED") {
      const { autoSyncBillsForCustomer } = await import("@/lib/auto-bill-sync");
      await autoSyncBillsForCustomer(customerId, values.deliveryDate, values.customerName);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating cylinder entry:", error);
    
    if (error?.code === "P2025") {
      return { success: false, error: "Cylinder entry not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cylinder entry",
    };
  }
}

export async function deleteCylinderEntry(id: string) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("addCylinder");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid cylinder entry ID." };
    }

    // Check if entry exists and get its details
    const existing = await prisma.cylinderEntry.findUnique({
      where: { id },
      select: { 
        id: true,
        adminId: true,
        cylinderType: true,
        customerName: true,
        deliveryDate: true,
        cylinderLabel: true,
        unitPrice: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Cylinder entry not found." };
    }

    // Verify access to this entry's tenant data
    if (!(await canAccessTenantData(existing.adminId))) {
      return { success: false, error: "You do not have permission to delete this cylinder entry." };
    }

    // Use a transaction to delete the entry and associated RECEIVED entries
    await prisma.$transaction(async (tx) => {
      // Delete the main entry
      await tx.cylinderEntry.delete({
        where: { id },
      });

      // If deleting a DELIVERED entry, also delete associated RECEIVED entries
      // RECEIVED entries match DELIVERED entries by: date, customer, cylinderLabel, and unitPrice
      if (existing.cylinderType === "DELIVERED") {
        // Get start and end of the day for date matching
        const deliveryDate = existing.deliveryDate;
        const startOfDay = new Date(deliveryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(deliveryDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Extract customer name only (in case it's in format "3 · Ijaz")
        let customerNameOnly = existing.customerName;
        if (existing.customerName.includes(" · ")) {
          customerNameOnly = existing.customerName.split(" · ")[1];
        }

        // Delete all RECEIVED entries that match this DELIVERED entry (same tenant)
        await tx.cylinderEntry.deleteMany({
          where: {
            adminId: existing.adminId, // Same tenant
            cylinderType: "RECEIVED",
            deliveryDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            cylinderLabel: existing.cylinderLabel,
            unitPrice: existing.unitPrice,
            OR: [
              { customerName: existing.customerName },
              { customerName: customerNameOnly },
            ],
          },
        });
      }
    });

    revalidatePath("/add-cylinder");
    
    // Auto-sync bills when entry is deleted (sync all customers for that month)
    if (existing.cylinderType === "DELIVERED") {
      const { autoSyncAllBillsForMonth } = await import("@/lib/auto-bill-sync");
      await autoSyncAllBillsForMonth(existing.deliveryDate);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting cylinder entry:", error);
    
    if (error?.code === "P2025") {
      return { success: false, error: "Cylinder entry not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete cylinder entry",
    };
  }
}

export async function getCylinderEntry(id: string) {
  try {
    const entry = await prisma.cylinderEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return { success: false, error: "Cylinder entry not found" };
    }

    // Verify access to this entry's tenant data
    if (!(await canAccessTenantData(entry.adminId))) {
      return { success: false, error: "You do not have permission to view this cylinder entry." };
    }

    // Fetch customer data - first try by customerId, then try by parsing customerName (with tenant filter)
    const tenantFilter = await getTenantFilter();
    let customer = null;
    if (entry.customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          ...tenantFilter,
          id: entry.customerId,
        },
        select: {
          address: true,
          contactNumber: true,
        },
      });
    }
    
    // If customer not found by ID, try to find by parsing customerName (for older entries)
    if (!customer && entry.customerName) {
      if (entry.customerName.includes(" · ")) {
        // Format: "4 · Arham"
        const customerCode = parseInt(entry.customerName.split(" · ")[0]);
        const customerNameOnly = entry.customerName.split(" · ")[1];
        if (!isNaN(customerCode) && customerNameOnly) {
          customer = await prisma.customer.findFirst({
            where: {
              ...tenantFilter,
              customerCode: customerCode,
              name: customerNameOnly,
            },
            select: {
              address: true,
              contactNumber: true,
            },
          });
        }
      } else {
        // Try to find by name only
        customer = await prisma.customer.findFirst({
          where: {
            ...tenantFilter,
            name: entry.customerName,
          },
          select: {
            address: true,
            contactNumber: true,
          },
        });
      }
    }

    // Add customer address and phone to entry object
    const entryWithCustomer = {
      ...entry,
      customerAddress: customer?.address || null,
      customerPhone: customer?.contactNumber || null,
    };

    return { success: true, data: entryWithCustomer };
  } catch (error) {
    console.error("Error fetching cylinder entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch cylinder entry",
    };
  }
}

export async function deleteAllCylinderEntries() {
  "use server";

  try {
    // Check edit permission using core utility
    const { requireEditPermissionForAction } = await import("@/core/permissions/permission-guards");
    const permissionError = await requireEditPermissionForAction("addCylinder");
    if (permissionError) {
      return permissionError;
    }

    // Delete all cylinder entries
    const result = await prisma.cylinderEntry.deleteMany({});

    revalidatePath("/add-cylinder");
    revalidatePath("/");

    return {
      success: true,
      message: `Successfully deleted ${result.count} cylinder entries.`,
      count: result.count,
    };
  } catch (error) {
    console.error("Error deleting all cylinder entries:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete cylinder entries",
    };
  }
}

