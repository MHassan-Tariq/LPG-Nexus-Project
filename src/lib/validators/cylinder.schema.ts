/**
 * Cylinder Validation Schemas
 * 
 * Centralized cylinder-related Zod schemas.
 */

import { z } from "zod";

export const cylinderCreateSchema = z.object({
  serialNumber: z.string().min(3).max(32),
  gasType: z.string().min(1).max(24),
  capacityLiters: z.coerce.number().int().positive(),
  status: z.enum(["IN_STOCK", "ASSIGNED", "MAINTENANCE", "RETIRED"]).optional(),
  location: z.string().min(1).max(80),
  pressurePsi: z.coerce.number().positive().optional().nullable(),
  lastInspection: z.coerce.date().optional().nullable(),
  nextInspection: z.coerce.date().optional().nullable(),
  customerId: z.string().cuid().optional().nullable(),
  notes: z.string().max(160).optional().nullable(),
});

export const cylinderUpdateSchema = cylinderCreateSchema.partial();

