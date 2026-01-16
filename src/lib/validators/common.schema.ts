/**
 * Common Validation Schemas
 * 
 * Shared schemas used across multiple modules.
 */

import { z } from "zod";

/**
 * Standard pagination parameters schema
 * Used across all API routes and pages
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().min(1).max(120).optional(),
});

/**
 * Transaction schema
 */
export const transactionSchema = z.object({
  cylinderId: z.string().cuid(),
  customerId: z.string().cuid().optional().nullable(),
  type: z.enum(["ISSUE", "RETURN", "MAINTENANCE", "INSPECTION"]),
  quantity: z.coerce.number().int().positive().max(100),
  recordedAt: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(240).optional().nullable(),
});

/**
 * OTP request schema
 */
export const otpRequestSchema = z.object({
  email: z.string().email(),
});

/**
 * OTP verify schema
 */
export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be 6 digits"),
});

