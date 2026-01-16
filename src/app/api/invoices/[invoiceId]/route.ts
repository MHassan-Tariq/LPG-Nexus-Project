import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { requireEditPermission } from "@/lib/api-permissions";
import { logInvoiceDeleted } from "@/lib/payment-logs";
import { format } from "date-fns";
import { canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createUnauthorizedResponse, createNotFoundResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

interface Params {
  params: {
    invoiceId: string;
  };
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    // Check edit permission for invoices (using payments module)
    const permissionError = await requireEditPermission("payments");
    if (permissionError) {
      return permissionError;
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    const tenantFilter = await getTenantFilter();
    
    // Find invoice by invoiceNumber (from URL) or ID (with tenant filter)
    const invoice = await prisma.invoice.findFirst({
      where: {
        ...tenantFilter,
        OR: [
          { invoiceNumber: params.invoiceId },
          { id: params.invoiceId },
        ],
      },
      include: {
        bill: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!invoice) {
      return createNotFoundResponse("Invoice");
    }

    // Verify access to this invoice's tenant data
    if (!(await canAccessTenantData(invoice.adminId))) {
      return createForbiddenResponse("You do not have permission to delete this invoice.");
    }

    // Store invoice info for logging before deletion
    const invoiceInfo = {
      billId: invoice.billId,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.bill.customer.name,
      customerCode: invoice.bill.customer.customerCode,
      billStartDate: invoice.bill.billStartDate,
      billEndDate: invoice.bill.billEndDate,
      amount: invoice.bill.lastMonthRemaining + invoice.bill.currentMonthBill,
    };

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete invoice record
      await tx.invoice.delete({
        where: { id: invoice.id },
      });

      // Log deletion
      await logInvoiceDeleted({
        billId: invoice.billId,
        customerName: invoice.bill.customer.name,
        customerCode: invoice.bill.customer.customerCode,
        billStartDate: invoice.bill.billStartDate,
        billEndDate: invoice.bill.billEndDate,
        amount: invoice.bill.lastMonthRemaining + invoice.bill.currentMonthBill,
        details: `Invoice ${invoice.invoiceNumber} deleted`,
      });
    });

    // Delete PDF file from disk (best effort - don't fail if file doesn't exist)
    try {
      const fileName = `${invoice.invoiceNumber}.pdf`;
      const filePath = join(process.cwd(), "public", "invoices", fileName);
      await unlink(filePath);
    } catch (fileError: any) {
      // File might not exist, which is okay
      if (fileError.code !== "ENOENT") {
        console.error("Error deleting invoice PDF file:", fileError);
      }
    }

    return successResponse({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    
    if (error?.code === "P2025") {
      return createNotFoundResponse("Invoice");
    }
    
    return createErrorResponse(error?.message || "Failed to delete invoice", 500);
  }
}
