import { InventoryTableClient } from "./inventory-table-client";

export interface InventoryEntry {
  id: string;
  cylinderType: string;
  category: string;
  quantity: number;
  unitPrice: number | null;
  vendor: string;
  receivedBy: string;
  description?: string | null;
  verified: boolean;
  entryDate: string;
}

export function InventoryTable({ entries }: { entries: InventoryEntry[] }) {
  return <InventoryTableClient entries={entries} />;
}

