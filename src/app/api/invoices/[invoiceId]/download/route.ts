import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { logInvoiceDownloaded } from "@/lib/payment-logs";
import { getCurrentUser } from "@/lib/jwt";
import { canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createNotFoundResponse, createForbiddenResponse, createErrorResponse } from "@/core/api/api-errors";

interface Params {
  params: {
    invoiceId: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  try {
    // Get current user for logging
    const currentUser = await getCurrentUser();
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
      return createForbiddenResponse("You do not have permission to download this invoice.");
    }

    // Log download event if user is authenticated
    if (currentUser) {
      try {
        await logInvoiceDownloaded({
          billId: invoice.billId,
          customerName: invoice.bill.customer.name,
          customerCode: invoice.bill.customer.customerCode,
          billStartDate: invoice.bill.billStartDate,
          billEndDate: invoice.bill.billEndDate,
          amount: invoice.bill.lastMonthRemaining + invoice.bill.currentMonthBill,
          details: `Invoice ${invoice.invoiceNumber} downloaded`,
        });
      } catch (logError) {
        // Don't fail the download if logging fails
        console.error("Error logging invoice download:", logError);
      }
    }

    // Read PDF file from disk
    const fileName = `${invoice.invoiceNumber}.pdf`;
    const filePath = join(process.cwd(), "public", "invoices", fileName);

    try {
      const pdfBuffer = await readFile(filePath);

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
          "Cache-Control": "private, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (fileError) {
      // If file doesn't exist, regenerate it
      console.warn(`Invoice PDF file not found, regenerating: ${filePath}`);
      
      // Regenerate PDF
      const { generateBillPDF, saveInvoicePDF } = await import("@/lib/invoice-utils");
      const pdfBuffer = await generateBillPDF(invoice.bill);
      await saveInvoicePDF(invoice.invoiceNumber, pdfBuffer);

      // Update invoice record
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl: invoice.pdfUrl }, // Keep same URL
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    }
  } catch (error: any) {
    console.error("Error downloading invoice:", error);
    return createErrorResponse(error?.message || "Failed to download invoice", 500);
  }
}
