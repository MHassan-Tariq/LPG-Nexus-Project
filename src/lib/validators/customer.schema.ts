/**
 * Customer Validation Schemas
 * 
 * Centralized customer-related Zod schemas.
 */

import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2).max(80),
  contactNumber: z
    .string()
    .max(11, "Pakistani phone number must be exactly 11 digits")
    .min(11, "Pakistani phone number must be exactly 11 digits")
    .regex(/^\d{11}$/, "Pakistani phone number must be exactly 11 digits")
    .optional()
    .default(""),
  customerType: z.string().min(2).max(48).default("Domestic"),
  cylinderType: z.string().min(2).max(64),
  billType: z.string().min(2).max(32),
  securityDeposit: z.coerce.number().int().min(0).optional(),
  address: z.string().min(5).max(200),
  area: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  notes: z.string().max(200).optional().nullable(),
  additionalContacts: z
    .array(
      z.object({
        name: z.string().min(2).max(80),
        contactNumber: z
          .string()
          .length(11, "Pakistani phone number must be exactly 11 digits")
          .regex(/^\d{11}$/, "Pakistani phone number must be exactly 11 digits"),
      }),
    )
    .optional()
    .default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
});

