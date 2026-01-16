import { z } from "zod";

export const inventoryLineSchema = z.object({
  cylinderType: z.string().min(2),
  category: z.string().min(2),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).optional().nullable(),
  ),
});

const sharedInventoryMeta = {
  vendor: z.string().min(2).regex(/^[a-zA-Z\s\-'.,&]+$/, "Vendor name should only contain letters, spaces, and common punctuation"),
  description: z.string().max(200).optional().nullable(),
  verified: z.boolean().optional(),
  receivedBy: z.string().min(2, "Enter receiver name"),
};

export const inventoryFormSchema = z.object({
  entries: z.array(inventoryLineSchema).min(1, "Add at least one cylinder type"),
  entryDate: z.coerce.date(),
  ...sharedInventoryMeta,
});

export const inventoryUpdateSchema = inventoryLineSchema.extend({
  ...sharedInventoryMeta,
  entryDate: z.coerce.date(),
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
export type InventoryUpdateValues = z.infer<typeof inventoryUpdateSchema>;


