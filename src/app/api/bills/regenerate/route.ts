import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

/**
 * Regenerate all bills by deleting all existing bills and recreating them from cylinder entries
 * This ensures all bills are fresh and accurate
 */
export async function POST() {
  try {
    console.log("Starting bill regeneration...");

    const tenantFilter = await getTenantFilter();
    
    // Step 1: Delete all payments first (they reference bills) - only for this tenant
    const deletePaymentsResult = await prisma.payment.deleteMany({
      where: tenantFilter,
    });
    console.log(`Deleted ${deletePaymentsResult.count} existing payments`);

    // Step 2: Delete all existing bills - only for this tenant
    const deleteResult = await prisma.bill.deleteMany({
      where: tenantFilter,
    });
    console.log(`Deleted ${deleteResult.count} existing bills`);

    // Step 3: Get all customers (with tenant filter)
    const customers = await prisma.customer.findMany({
      where: tenantFilter,
      select: {
        id: true,
        name: true,
        customerCode: true,
      },
    });

    console.log(`Found ${customers.length} customers to process`);

    let billsCreated = 0;
    let errors: string[] = [];

    // Step 4: Process each customer and create bills
    for (const customer of customers) {
      try {
        // Get all DELIVERED entries for this customer (with tenant filter)
        const allEntries = await prisma.cylinderEntry.findMany({
          where: {
            ...tenantFilter,
            OR: [
              { customerId: customer.id },
              { customerName: customer.name },
            ],
            cylinderType: "DELIVERED",
          },
          select: {
            deliveryDate: true,
            quantity: true,
            amount: true,
          },
          orderBy: {
            deliveryDate: "asc",
          },
        });

        if (allEntries.length === 0) {
          continue; // Skip customers with no deliveries
        }

        // Group entries by month
        const entriesByMonth = new Map<string, typeof allEntries>();
        
        for (const entry of allEntries) {
          const monthStart = startOfMonth(entry.deliveryDate);
          const monthKey = monthStart.toISOString();
          
          if (!entriesByMonth.has(monthKey)) {
            entriesByMonth.set(monthKey, []);
          }
          entriesByMonth.get(monthKey)!.push(entry);
        }

        // Process each month in chronological order
        const sortedMonths = Array.from(entriesByMonth.entries()).sort((a, b) => 
          new Date(a[0]).getTime() - new Date(b[0]).getTime()
        );

        let previousBillRemaining = 0;

        for (const [monthKey, entries] of sortedMonths) {
          const monthStart = new Date(monthKey);
          const monthEnd = endOfMonth(monthStart);

          // Aggregate data from cylinder entries
          const totalQuantity = entries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
          const currentMonthBill = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

          // Use the remaining from previous month (calculated from previous bill)
          const lastMonthRemaining = previousBillRemaining;

          // Create bill for this month
          if (totalQuantity > 0 || currentMonthBill > 0) {
            const adminId = await getTenantIdForCreate();
            const bill = await prisma.bill.create({
              data: {
                customerId: customer.id,
                billStartDate: monthStart,
                billEndDate: monthEnd,
                lastMonthRemaining,
                currentMonthBill,
                cylinders: totalQuantity,
                adminId,
              },
            });

            // Calculate remaining for next month (assuming no payments for now)
            // This will be updated when payments are added
            const totalAmount = lastMonthRemaining + currentMonthBill;
            previousBillRemaining = totalAmount; // Carry forward to next month

            billsCreated++;
          }
        }
      } catch (error) {
        const errorMsg = `Error processing customer ${customer.name} (${customer.customerCode}): ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Note: Payments are deleted, so remaining amounts will be calculated fresh
    // When payments are added later, they will be properly associated with the new bills

    // Revalidate payments page
    revalidatePath("/payments");

    const result = {
      success: true,
      message: `Bills regenerated successfully. Deleted: ${deleteResult.count} bills and ${deletePaymentsResult.count} payments, Created: ${billsCreated} new bills`,
      stats: {
        billsDeleted: deleteResult.count,
        paymentsDeleted: deletePaymentsResult.count,
        customersProcessed: customers.length,
        billsCreated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Bill regeneration completed:", result);

    return successResponse(result);
  } catch (error) {
    console.error("Error during bill regeneration:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
}

