import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { requireEditPermission } from "@/lib/api-permissions";
import { logPaymentReceived, logPartialPayment } from "@/lib/payment-logs";
import { canAccessTenantData, getTenantIdForCreate } from "@/lib/tenant-utils";
import { createPaymentSchema } from "@/lib/validators";
// Core utilities
import { createValidationErrorResponse, createErrorResponse, createNotFoundResponse, createUnauthorizedResponse, createForbiddenResponse } from "@/core/api/api-errors";
import { createdResponse } from "@/core/api/api-response";

export async function POST(request: Request) {
  try {
    // Check edit permission for payments module
    const permissionError = await requireEditPermission("payments");
    if (permissionError) {
      return permissionError;
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return createUnauthorizedResponse();
    }

    const json = await request.json();
    const parseResult = createPaymentSchema.safeParse(json);

    if (!parseResult.success) {
      return createValidationErrorResponse(parseResult.error);
    }

    const { billId, amount, paidOn, method, notes } = parseResult.data;

    // Fetch bill with payments and customer
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        customer: true,
        payments: { select: { amount: true } },
        invoice: { select: { id: true } }, // Check if invoice exists for financial locking
      },
    });

    if (!bill) {
      return createNotFoundResponse("Bill");
    }

    // Verify access to this bill's tenant data
    if (!(await canAccessTenantData(bill.adminId))) {
      return createForbiddenResponse("You do not have permission to add payments to this bill.");
    }

    // Financial Locking: Check if invoice exists
    if (bill.invoice) {
      return createForbiddenResponse(
        "Cannot add payment. This bill has an invoice generated. Please delete the invoice first to modify payments."
      );
    }

    // Calculate current totals
    const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
    const currentPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totalAmount - currentPaid;

    // Validate payment amount doesn't exceed remaining
    if (amount > remaining) {
      return createErrorResponse(
        `Payment amount (Rs ${amount.toLocaleString()}) cannot exceed remaining amount (Rs ${remaining.toLocaleString()}).`,
        400
      );
    }

    // Use transaction to ensure atomicity
    const adminId = await getTenantIdForCreate();
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const createdPayment = await tx.payment.create({
        data: {
          billId,
          amount,
          paidOn: new Date(paidOn),
          method,
          notes: notes || null,
          adminId,
        },
      });

      // Determine if this is full payment or partial payment
      const newPaid = currentPaid + amount;
      const newRemaining = totalAmount - newPaid;
      const isFullPayment = newRemaining <= 0;
      const isPartialPayment = newPaid > 0 && newRemaining > 0;

      // Log payment event
      if (isFullPayment) {
        await logPaymentReceived({
          paymentId: createdPayment.id,
          billId: bill.id,
          customerName: bill.customer.name,
          customerCode: bill.customer.customerCode,
          billStartDate: bill.billStartDate,
          billEndDate: bill.billEndDate,
          amount,
          details: `Full payment received via ${method}. ${notes ? `Notes: ${notes}` : ""}`,
        });
      } else if (isPartialPayment) {
        await logPartialPayment({
          paymentId: createdPayment.id,
          billId: bill.id,
          customerName: bill.customer.name,
          customerCode: bill.customer.customerCode,
          billStartDate: bill.billStartDate,
          billEndDate: bill.billEndDate,
          amount,
          details: `Partial payment of Rs ${amount.toLocaleString()} received via ${method}. Remaining: Rs ${newRemaining.toLocaleString()}. ${notes ? `Notes: ${notes}` : ""}`,
        });
      }

      return createdPayment;
    });

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);

    if (error?.code === "P1001" || error?.code === "P1017") {
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 500 }
      );
    }

    return createErrorResponse(error?.message || "Failed to create payment", 500);
  }
}
