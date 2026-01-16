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
 * Resync all bills for all customers based on current cylinder entries
 * This ensures all bills are up-to-date with the latest cylinder data
 */
export async function GET() {
  try {
    console.log("Starting full bill resync...");

    // Get all customers (with tenant filter)
    const tenantFilter = await getTenantFilter();
    const customers = await prisma.customer.findMany({
      where: tenantFilter,
      select: {
        id: true,
        name: true,
        customerCode: true,
      },
    });

    console.log(`Found ${customers.length} customers to sync`);

    let billsCreated = 0;
    let billsUpdated = 0;
    let errors: string[] = [];

    // Process each customer
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

        // Process each month
        for (const [monthKey, entries] of entriesByMonth.entries()) {
          const monthStart = new Date(monthKey);
          const monthEnd = endOfMonth(monthStart);

          // Aggregate data from cylinder entries
          const totalQuantity = entries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
          const currentMonthBill = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

          // Get previous bill's remaining amount (if exists)
          const previousBill = await prisma.bill.findFirst({
            where: {
              ...tenantFilter,
              customerId: customer.id,
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
              customerId: customer.id,
              billStartDate: monthStart,
              billEndDate: monthEnd,
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
            billsUpdated++;
          } else {
            // Create new bill if there are deliveries
            if (totalQuantity > 0 || currentMonthBill > 0) {
              const adminId = await getTenantIdForCreate();
              await prisma.bill.create({
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
              billsCreated++;
            }
          }
        }
      } catch (error) {
        const errorMsg = `Error syncing customer ${customer.name} (${customer.customerCode}): ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Revalidate payments page
    revalidatePath("/payments");

    const result = {
      success: true,
      message: `Bill resync completed. Created: ${billsCreated}, Updated: ${billsUpdated}`,
      stats: {
        customersProcessed: customers.length,
        billsCreated,
        billsUpdated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Bill resync completed:", result);

    return successResponse(result);
  } catch (error) {
    console.error("Error during full bill resync:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
}

