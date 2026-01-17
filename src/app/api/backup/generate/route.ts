export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";

export async function GET() {
  try {
    // Fetch ALL data from ALL database tables independently
    const [
      customers,
      cylinders,
      cylinderTransactions,
      cylinderEntries,
      expenses,
      bills,
      payments,
      paymentLogs,
      inventoryItems,
      dailyNotes,
      users,
      otps,
      systemSettings,
    ] = await Promise.all([
      prisma.customer.findMany(),
      prisma.cylinder.findMany(),
      prisma.cylinderTransaction.findMany(),
      prisma.cylinderEntry.findMany(),
      prisma.expense.findMany(),
      prisma.bill.findMany(),
      prisma.payment.findMany(),
      prisma.paymentLog.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.dailyNote.findMany(),
      prisma.user.findMany(),
      prisma.otp.findMany(),
      prisma.systemSettings.findMany(),
    ]);

    // Create backup object
    const backupData = {
      version: "1.0",
      backupDate: new Date().toISOString(),
      data: {
        customers,
        cylinders,
        cylinderTransactions,
        cylinderEntries,
        expenses,
        bills,
        payments,
        paymentLogs,
        inventoryItems,
        dailyNotes,
        users,
        otps,
        systemSettings,
      },
    };

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm");
    const fileName = `backup-${timestamp}.json`;

    // Save backup record
    const jsonString = JSON.stringify(backupData, null, 2);
    const adminId = await getTenantIdForCreate();
    await prisma.backup.create({
      data: {
        fileName,
        fileSize: jsonString.length,
        backupDate: new Date(),
        isAutomatic: false,
        adminId,
      },
    });

    // Return as downloadable JSON file
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Backup generation error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to generate backup",
      500
    );
  }
}
