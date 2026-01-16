"use server";

import { PaymentEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getTenantIdForCreate } from "@/lib/tenant-utils";

interface BaseLogPayload {
  billId?: string;
  paymentId?: string;
  customerName: string;
  customerCode?: number;
  billStartDate?: Date;
  billEndDate?: Date;
  amount?: number;
  details?: string;
}

export async function logPaymentEvent(eventType: PaymentEventType, payload: BaseLogPayload) {
  const adminId = await getTenantIdForCreate();
  await prisma.paymentLog.create({
    data: {
      eventType,
      billId: payload.billId ?? null,
      paymentId: payload.paymentId ?? null,
      customerName: payload.customerName,
      customerCode: payload.customerCode ?? null,
      amount: payload.amount ?? null,
      details: payload.details ?? null,
      billStartDate: payload.billStartDate ?? null,
      billEndDate: payload.billEndDate ?? null,
      adminId,
    },
  });

  revalidatePath("/payment-logs");
  revalidatePath("/");
}

export async function logBillGenerated(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.BILL_GENERATED, payload);
}

export async function logBillUpdated(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.BILL_UPDATED, payload);
}

export async function logBillDeleted(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.BILL_DELETED, payload);
}

export async function logPaymentReceived(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.PAYMENT_RECEIVED, payload);
}

export async function logPartialPayment(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.PARTIAL_PAYMENT, payload);
}

export async function logInvoiceGenerated(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.INVOICE_GENERATED, payload);
}

export async function logInvoiceDownloaded(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.INVOICE_DOWNLOADED, payload);
}

export async function logInvoiceDeleted(payload: BaseLogPayload) {
  return logPaymentEvent(PaymentEventType.INVOICE_DELETED, payload);
}

