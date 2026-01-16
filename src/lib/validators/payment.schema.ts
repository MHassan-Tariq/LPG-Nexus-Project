/**
 * Payment Validation Schemas
 * 
 * Centralized payment-related Zod schemas.
 */

import { z } from "zod";

export const createPaymentSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  amount: z.number().positive("Amount must be greater than 0").int("Amount must be a whole number"),
  paidOn: z.string().datetime("Invalid date format"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().nullable().optional(),
});

