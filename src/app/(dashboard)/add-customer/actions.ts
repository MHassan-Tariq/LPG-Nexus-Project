"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/lib/validators";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

export async function deleteCustomer(id: string) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("addCustomer");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid customer ID." };
    }

    // Verify access to this customer's tenant data
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!customer) {
      return { success: false, error: "Customer not found." };
    }

    if (!(await canAccessTenantData(customer.adminId))) {
      return { success: false, error: "You do not have permission to delete this customer." };
    }

    // Use a transaction to delete all related records
    await prisma.$transaction(async (tx) => {
      // 1. Find all bills for this customer
      const bills = await tx.bill.findMany({
        where: { customerId: id },
        select: { id: true },
      });

      const billIds = bills.map((bill) => bill.id);

      // 2. Delete all payments for these bills
      if (billIds.length > 0) {
        await tx.payment.deleteMany({
          where: { billId: { in: billIds } },
        });
      }

      // 3. Delete all bills for this customer
      await tx.bill.deleteMany({
        where: { customerId: id },
      });

      // 4. Find all cylinders for this customer
      const cylinders = await tx.cylinder.findMany({
        where: { customerId: id },
        select: { id: true },
      });

      const cylinderIds = cylinders.map((cylinder) => cylinder.id);

      // 5. Delete all transactions that reference these cylinders
      if (cylinderIds.length > 0) {
        await tx.cylinderTransaction.deleteMany({
          where: { cylinderId: { in: cylinderIds } },
        });
      }

      // 6. Delete all transactions that directly reference this customer
      await tx.cylinderTransaction.deleteMany({
        where: { customerId: id },
      });

      // 7. Delete all cylinders for this customer
      await tx.cylinder.deleteMany({
        where: { customerId: id },
      });

      // 8. Finally, delete the customer
      await tx.customer.delete({
        where: { id },
      });
    });

    revalidatePath("/add-customer");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    
    if (error?.code === "P2025") {
      return { success: false, error: "Customer not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to delete customer." };
  }
}

export async function getCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        cylinders: true,
        transactions: {
          include: { cylinder: true },
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found." };
    }

    // Verify access to this customer's tenant data
    if (!(await canAccessTenantData(customer.adminId))) {
      return { success: false, error: "You do not have permission to view this customer." };
    }

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return { success: false, error: "Failed to fetch customer." };
  }
}

export async function updateCustomer(id: string, values: any) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("addCustomer");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid customer ID." };
    }

    // Verify access to this customer's tenant data
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!existingCustomer) {
      return { success: false, error: "Customer not found." };
    }

    if (!(await canAccessTenantData(existingCustomer.adminId))) {
      return { success: false, error: "You do not have permission to update this customer." };
    }

    const parsed = customerSchema.parse({
      ...values,
      status: values.status ?? "ACTIVE",
    });

    const normalizedContacts =
      parsed.additionalContacts?.map((contact: any) => ({
        name: contact.name.trim(),
        contactNumber: contact.contactNumber.trim(),
      })) ?? [];
    const contactNumber = normalizedContacts[0]?.contactNumber || parsed.contactNumber;

    if (!contactNumber) {
      throw new Error("At least one contact number is required.");
    }

    await prisma.customer.update({
      where: { id },
      data: {
        name: parsed.name,
        contactNumber,
        customerType: parsed.customerType,
        cylinderType: parsed.cylinderType,
        billType: parsed.billType,
        securityDeposit: parsed.securityDeposit ?? 0,
        area: parsed.area,
        city: parsed.city,
        country: parsed.country,
        address: parsed.address,
        notes: parsed.notes ?? null,
        additionalContacts: normalizedContacts,
        status: parsed.status ?? "ACTIVE",
        email: parsed.email ?? null,
      },
    });

    revalidatePath("/add-customer");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid customer data." };
    }
    
    if (error?.code === "P2025") {
      return { success: false, error: "Customer not found." };
    }
    
    if (error?.code === "P2002") {
      return { success: false, error: "A customer with this email or contact number already exists." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to update customer." };
  }
}

