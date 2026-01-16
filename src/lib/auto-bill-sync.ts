"use server";

import { startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { logBillGenerated } from "@/lib/payment-logs";
import { revalidatePath } from "next/cache";
import { getTenantFilter, getTenantIdForCreate } from "@/lib/tenant-utils";

/**
 * Automatically sync bills for a customer when cylinder entries change
 * This function updates or creates bills based on cylinder deliveries
 */
export async function autoSyncBillsForCustomer(customerId: string | null, deliveryDate: Date, customerName?: string) {
  try {
    if (!customerId && !customerName) {
      return; // Skip if no customer ID or name
    }

    // Get the month range for the delivery date
    const monthStart = startOfMonth(deliveryDate);
    const monthEnd = endOfMonth(deliveryDate);

    // Extract customer name if it's in format "4 · Arham"
    const nameOnly = customerName && customerName.includes(" · ") 
      ? customerName.split(" · ")[1] 
      : customerName;

    // Build where clause - search by customerId OR customerName to catch all entries (with tenant filter)
    const tenantFilter = await getTenantFilter();
    const whereClause: any = {
      ...tenantFilter,
      cylinderType: "DELIVERED",
      deliveryDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    };

    // Use OR condition to find entries by either customerId or customerName
    if (customerId && nameOnly) {
      whereClause.OR = [
        { customerId: customerId },
        { customerName: nameOnly },
      ];
    } else if (customerId) {
      whereClause.customerId = customerId;
    } else if (nameOnly) {
      whereClause.customerName = nameOnly;
    } else {
      return; // Can't proceed without customer identifier
    }

    // Get all DELIVERED cylinder entries for this customer in this month
    const cylinderEntries = await prisma.cylinderEntry.findMany({
      where: whereClause,
      select: {
        quantity: true,
        amount: true,
        customerId: true,
        customerName: true,
      },
    });

    // If we don't have customerId but have entries, try to get it from the first entry
    let finalCustomerId = customerId;
    if (!finalCustomerId && cylinderEntries.length > 0 && cylinderEntries[0].customerId) {
      finalCustomerId = cylinderEntries[0].customerId;
    }
    
    // If still no customerId, try to find customer by name (with tenant filter)
    if (!finalCustomerId && customerName) {
      const nameOnly = customerName.includes(" · ") ? customerName.split(" · ")[1] : customerName;
      const customer = await prisma.customer.findFirst({
        where: {
          ...tenantFilter,
          name: nameOnly,
        },
        select: { id: true },
      });
      if (customer) {
        finalCustomerId = customer.id;
      }
    }

    if (!finalCustomerId) {
      console.warn("Cannot sync bill: No customer ID found for customer:", customerName);
      return; // Can't create/update bill without customer ID
    }

    // Aggregate data from cylinder entries
    const totalQuantity = cylinderEntries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    const currentMonthBill = cylinderEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

    // Get previous bill's remaining amount (if exists)
    const previousBill = await prisma.bill.findFirst({
      where: {
        ...tenantFilter,
        customerId: finalCustomerId,
        billEndDate: {
          lt: monthStart, // Previous period
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

    // Calculate last month remaining from previous unpaid bills
    let lastMonthRemaining = 0;
    if (previousBill) {
      const previousTotal = previousBill.lastMonthRemaining + previousBill.currentMonthBill;
      const previousPaid = previousBill.payments.reduce((sum, p) => sum + p.amount, 0);
      lastMonthRemaining = Math.max(0, previousTotal - previousPaid);
    }

    // Check if bill already exists for this customer and date range
    const existingBill = await prisma.bill.findFirst({
      where: {
        ...tenantFilter,
        customerId: finalCustomerId,
        billStartDate: monthStart,
        billEndDate: monthEnd,
      },
      include: {
        customer: {
          select: {
            name: true,
            customerCode: true,
          },
        },
      },
    });

    if (existingBill) {
      // Update existing bill
      await prisma.bill.update({
        where: { id: existingBill.id },
        data: {
          lastMonthRemaining,
          currentMonthBill,
          cylinders: totalQuantity,
        },
      });
    } else {
      // Only create bill if there are cylinder deliveries in the current period
      if (totalQuantity > 0 || currentMonthBill > 0) {
        // Wrap bill creation and logging in a transaction
        const adminId = await getTenantIdForCreate();
        await prisma.$transaction(async (tx) => {
          const bill = await tx.bill.create({
            data: {
              customerId: finalCustomerId,
              billStartDate: monthStart,
              billEndDate: monthEnd,
              lastMonthRemaining,
              currentMonthBill,
              adminId,
              cylinders: totalQuantity,
            },
          });

          const customer = await tx.customer.findUnique({
            where: { id: finalCustomerId },
            select: { name: true, customerCode: true },
          });

          if (customer) {
            await logBillGenerated({
              billId: bill.id,
              customerName: customer.name,
              customerCode: customer.customerCode,
              billStartDate: monthStart,
              billEndDate: monthEnd,
              amount: lastMonthRemaining + currentMonthBill,
              details: `Bill auto-generated from ${cylinderEntries.length} cylinder delivery(ies) totaling ${totalQuantity} cylinder(s).`,
            });
          }
        });
      }
    }

    // Revalidate payments page to reflect changes
    revalidatePath("/payments");
  } catch (error) {
    console.error("Error auto-syncing bills for customer:", error);
    // Don't throw error - we don't want to break cylinder entry creation/update
  }
}

/**
 * Auto-sync bills for all customers when a cylinder entry is deleted
 * This ensures bills are recalculated correctly
 */
export async function autoSyncAllBillsForMonth(deliveryDate: Date) {
  try {
    const monthStart = startOfMonth(deliveryDate);
    const monthEnd = endOfMonth(deliveryDate);

    // Get all customers who have cylinder entries in this month (with tenant filter)
    const tenantFilter = await getTenantFilter();
    const customers = await prisma.customer.findMany({
      where: tenantFilter,
      select: { id: true },
    });

    // Sync bills for each customer
    await Promise.all(
      customers.map((customer) => autoSyncBillsForCustomer(customer.id, deliveryDate))
    );
  } catch (error) {
    console.error("Error auto-syncing all bills for month:", error);
  }
}

