import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { requireEditPermission } from "@/lib/api-permissions";
import { generateInvoiceNumber, generateBillPDF, saveInvoicePDF } from "@/lib/invoice-utils";
import { logInvoiceGenerated } from "@/lib/payment-logs";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createUnauthorizedResponse, createNotFoundResponse, createForbiddenResponse, createValidationErrorResponse, createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

const generateInvoiceSchema = z.object({
  billIds: z.array(z.string().min(1)).min(1, "At least one bill ID is required"),
});

export async function POST(request: Request) {
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

    const json = await request.json();
    const parseResult = generateInvoiceSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const { billIds } = parseResult.data;
    const tenantFilter = await getTenantFilter();

    // Fetch bills with customers (with tenant filter)
    const bills = await prisma.bill.findMany({
      where: {
        ...tenantFilter,
        id: { in: billIds },
      },
      include: {
        customer: true,
        payments: { orderBy: { paidOn: "desc" } },
        invoice: true, // Check if invoice already exists
      },
    });

    if (bills.length !== billIds.length) {
      return createNotFoundResponse("Some bills");
    }

    // Verify access to all bills' tenant data
    for (const bill of bills) {
      if (!(await canAccessTenantData(bill.adminId))) {
        return createForbiddenResponse("You do not have permission to generate invoices for some of these bills.");
      }
    }

    // Check for existing invoices
    const billsWithInvoices = bills.filter((bill) => bill.invoice);
    if (billsWithInvoices.length > 0) {
      return createErrorResponse(
        `Some bills already have invoices generated. Bill IDs: ${billsWithInvoices.map((b) => b.id).join(", ")}`,
        400
      );
    }

    const results = [];

    // Generate invoices for each bill
    for (const bill of bills) {
      try {
        // Generate unique invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // Generate PDF buffer
        const pdfBuffer = await generateBillPDF(bill as any);

        // Save PDF to disk and get the public URL path
        const pdfUrl = await saveInvoicePDF(invoiceNumber, pdfBuffer);

        // Create invoice record in transaction
        const adminId = await getTenantIdForCreate();
        const invoice = await prisma.$transaction(async (tx) => {
          const created = await tx.invoice.create({
            data: {
              invoiceNumber,
              billId: bill.id,
              customerId: bill.customerId,
              pdfUrl,
              generatedById: currentUser.userId,
              adminId,
            },
          });

          // Log invoice generation
          await logInvoiceGenerated({
            billId: bill.id,
            customerName: bill.customer.name,
            customerCode: bill.customer.customerCode,
            billStartDate: bill.billStartDate,
            billEndDate: bill.billEndDate,
            amount: bill.lastMonthRemaining + bill.currentMonthBill,
            details: `Invoice ${invoiceNumber} generated for bill period ${format(bill.billStartDate, "yyyy-MM-dd")} to ${format(bill.billEndDate, "yyyy-MM-dd")}`,
          });

          return created;
        });

        results.push({
          billId: bill.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error generating invoice for bill ${bill.id}:`, error);
        results.push({
          billId: bill.id,
          success: false,
          error: error?.message || "Failed to generate invoice",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return successResponse({
      success: successCount === billIds.length,
      results,
      message: `Successfully generated ${successCount} of ${billIds.length} invoices`,
    });
  } catch (error: any) {
    console.error("Error in invoice generation:", error);
    return createErrorResponse(error?.message || "Failed to generate invoices", 500);
  }
}
