/**
 * Payments Actions
 * 
 * IMPORTANT: SINGLE SOURCE OF TRUTH FOR PAYMENTS
 * ===============================================
 * 
 * This is the ONLY place where Payment records should be created/updated/deleted.
 * 
 * Design Principle:
 * - Payment entry: ONLY from /payments page (this module)
 * - Payment visibility: Everywhere (read-only on other pages)
 * 
 * This ensures:
 * - No duplicate payments
 * - Consistent audit logs
 * - Accurate remaining amounts
 * - Financial data integrity
 * 
 * See: docs/PAYMENT_DESIGN_PRINCIPLES.md for full design documentation.
 */

"use server";

import { startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  logBillGenerated,
  logBillDeleted,
} from "@/lib/payment-logs";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

interface BulkGenerateInput {
  from: Date;
  to: Date;
}

export async function bulkGenerateBillsAction(input: BulkGenerateInput) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("payments");
    if (permissionError) {
      return permissionError;
    }

    const from = startOfDay(input.from);
    const to = startOfDay(input.to);
    if (from >= to) {
      return { success: false, error: "Invalid billing range. End date must be after start date." };
    }

    const tenantFilter = await getTenantFilter();
    const customers = await prisma.customer.findMany({
      where: tenantFilter,
      select: { id: true, customerCode: true, name: true },
    });

    if (customers.length === 0) {
      return { success: false, error: "No customers found. Please add customers before generating bills." };
    }

    // Use transaction for each customer to ensure atomicity
    await Promise.all(
      customers.map(async (customer) => {
        // Check if bill already exists for this customer and date range
        const existing = await prisma.bill.findFirst({
          where: { customerId: customer.id, billStartDate: from, billEndDate: to },
          select: { id: true },
        });
        if (existing) return;

        // Get cylinder entries for this customer within the date range (DELIVERED type only)
        const cylinderEntries = await prisma.cylinderEntry.findMany({
          where: {
            ...tenantFilter,
            customerId: customer.id,
            cylinderType: "DELIVERED",
            deliveryDate: {
              gte: from,
              lte: to,
            },
          },
          select: {
            quantity: true,
            amount: true,
          },
        });

        // Aggregate data from cylinder entries
        const totalQuantity = cylinderEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const currentMonthBill = cylinderEntries.reduce((sum, entry) => sum + entry.amount, 0);

        // Get previous bill's remaining amount (if exists)
        const previousBill = await prisma.bill.findFirst({
          where: {
            ...tenantFilter,
            customerId: customer.id,
            billEndDate: {
              lt: from, // Previous period
            },
          },
          include: {
            payments: {
              select: { amount: true },
            },
          },
          orderBy: {
            billEndDate: "desc",
          },
        });

        // Only create bill if there are cylinder deliveries in the current period
        if (totalQuantity === 0 && currentMonthBill === 0) {
          return; // Skip customers with no cylinder deliveries in this period
        }

        // Calculate last month remaining from previous unpaid bills
        let lastMonthRemaining = 0;
        if (previousBill) {
          const previousTotal = previousBill.lastMonthRemaining + previousBill.currentMonthBill;
          const previousPaid = previousBill.payments.reduce((sum, p) => sum + p.amount, 0);
          lastMonthRemaining = Math.max(0, previousTotal - previousPaid);
        }

        // Wrap bill creation and logging in a transaction
        const adminId = await getTenantIdForCreate();
        await prisma.$transaction(async (tx) => {
          const bill = await tx.bill.create({
            data: {
              customerId: customer.id,
              billStartDate: from,
              billEndDate: to,
              lastMonthRemaining,
              currentMonthBill,
              cylinders: totalQuantity,
              adminId,
            },
          });

          await logBillGenerated({
            billId: bill.id,
            customerName: customer.name,
            customerCode: customer.customerCode,
            billStartDate: from,
            billEndDate: to,
            amount: lastMonthRemaining + currentMonthBill,
            details: `Bill generated from ${cylinderEntries.length} cylinder delivery(ies) totaling ${totalQuantity} cylinder(s).`,
          });
        });
      }),
    );

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error generating bills:", error);
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to generate bills." };
  }
}

export async function deleteBillAction(id: string) {
  try {
    // Check edit permission for payments module
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("payments");
    if (permissionError) {
      return permissionError;
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid bill ID." };
    }

    // Check if bill exists first
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { payments: true, customer: true, invoice: { select: { id: true } } },
    });

    if (!bill) {
      return { success: false, error: "Bill not found." };
    }

    // Verify access to this bill's tenant data
    if (!(await canAccessTenantData(bill.adminId))) {
      return { success: false, error: "You do not have permission to delete this bill." };
    }

    // Financial Locking: Block deletion if invoice exists
    if (bill.invoice) {
      return {
        success: false,
        error:
          "Cannot delete bill. This bill has an invoice generated. Please delete the invoice first to modify or delete the bill.",
      };
    }

    // Store bill info for logging before deletion
    const billInfo = {
      customerName: bill.customer.name,
      customerCode: bill.customer.customerCode,
      billStartDate: bill.billStartDate,
      billEndDate: bill.billEndDate,
      amount: bill.lastMonthRemaining + bill.currentMonthBill,
    };

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete all payments first (due to foreign key constraint)
      if (bill.payments.length > 0) {
        await tx.payment.deleteMany({
          where: { billId: id },
        });
      }

      // Then delete the bill
      await tx.bill.delete({
        where: { id },
      });

      // Log the deletion
      await logBillDeleted({
        billId: id,
        ...billInfo,
        details: `Bill deleted for ${billInfo.customerName}`,
      });
    });

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bill:", error);
    
    // Handle Prisma errors
    if (error?.code === "P2025") {
      return { success: false, error: "Bill not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to delete bill." };
  }
}

export async function getBillAction(id: string) {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: {
          orderBy: { paidOn: "desc" },
        },
      },
    });

    if (!bill) {
      return { success: false, error: "Bill not found." };
    }

    // Verify access to this bill's tenant data
    if (!(await canAccessTenantData(bill.adminId))) {
      return { success: false, error: "You do not have permission to view this bill." };
    }

    return { success: true, data: bill };
  } catch (error: any) {
    console.error("Error fetching bill:", error);
    return { success: false, error: error?.message || "Failed to fetch bill." };
  }
}

export async function deletePaymentAction(paymentId: string) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("payments");
    if (permissionError) {
      return permissionError;
    }

    if (!paymentId || typeof paymentId !== "string") {
      return { success: false, error: "Invalid payment ID." };
    }

    // Fetch payment with bill and invoice check
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        bill: {
          include: {
            invoice: { select: { id: true } },
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      return { success: false, error: "Payment not found." };
    }

    // Verify access to this payment's tenant data
    if (!(await canAccessTenantData(payment.adminId))) {
      return { success: false, error: "You do not have permission to delete this payment." };
    }

    // Financial Locking: Check if invoice exists
    if (payment.bill.invoice) {
      return {
        success: false,
        error:
          "Cannot delete payment. This bill has an invoice generated. Please delete the invoice first.",
      };
    }

    // Store payment info for logging before deletion
    const paymentInfo = {
      billId: payment.billId,
      customerName: payment.bill.customer.name,
      customerCode: payment.bill.customer.customerCode,
      amount: payment.amount,
      billStartDate: payment.bill.billStartDate,
      billEndDate: payment.bill.billEndDate,
    };

    // Delete payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Log payment deletion (using PAYMENT_RECEIVED event type for now)
    // Could add PAYMENT_DELETED to PaymentEventType enum if needed
    const adminId = await getTenantIdForCreate();
    await prisma.paymentLog.create({
      data: {
        billId: payment.billId,
        customerName: paymentInfo.customerName,
        customerCode: paymentInfo.customerCode,
        billStartDate: paymentInfo.billStartDate,
        billEndDate: paymentInfo.billEndDate,
        amount: paymentInfo.amount,
        eventType: "PAYMENT_RECEIVED", // Using existing type
        details: `Payment of Rs ${paymentInfo.amount.toLocaleString()} deleted`,
        adminId,
      },
    });

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting payment:", error);

    if (error?.code === "P2025") {
      return { success: false, error: "Payment not found." };
    }

    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }

    return { success: false, error: error?.message || "Failed to delete payment." };
  }
}

