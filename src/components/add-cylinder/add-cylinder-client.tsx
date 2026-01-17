"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CylinderForm, CylinderFormValues } from "./cylinder-form";
import { CylinderTable, CylinderEntryRow } from "./cylinder-table";
import { CylinderViewDrawer } from "./cylinder-view-drawer";
import { updateCylinderEntry, getCylinderEntry } from "@/app/add-cylinder/actions";
import { CylinderCustomerOption } from "./cylinder-form";

interface AddCylinderClientProps {
  entries: CylinderEntryRow[];
  query: string;
  period: string;
  page: number;
  totalPages: number;
  customers: CylinderCustomerOption[];
  pageSize: number;
}

export function AddCylinderClient({
  entries,
  query,
  period,
  page,
  totalPages,
  customers,
  pageSize,
}: AddCylinderClientProps) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<CylinderEntryRow | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CylinderEntryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleView(entry: CylinderEntryRow) {
    setSelectedEntry(entry);
    setViewDrawerOpen(true);
  }

  function handleEdit(entry: CylinderEntryRow) {
    setEditingEntry(entry);
    setViewDrawerOpen(false);
    // Convert entry to form values
    const formValues: Partial<CylinderFormValues> = {
      billCreatedBy: entry.billCreatedBy,
      cylinderType: entry.cylinderType,
      cylinderLabel: entry.cylinderLabel ?? "",
      deliveredBy: entry.deliveredBy ?? "",
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      amount: entry.amount,
      customerName: entry.customerName,
      verified: entry.verified,
      description: entry.description ?? "",
      deliveryDate: entry.deliveryDate,
    };
    setEditingEntry({ ...entry, formValues } as any);
  }

  async function handleUpdate(values: CylinderFormValues) {
    if (!editingEntry) return;

    startTransition(async () => {
      const result = await updateCylinderEntry(editingEntry.id, values);
      if (result.success) {
        setEditingEntry(null);
        router.refresh();
      }
    });
  }

  function handleCancelEdit() {
    setEditingEntry(null);
  }

  // Convert editing entry to initial values
  const initialValues: Partial<CylinderFormValues> | undefined = editingEntry
    ? {
        billCreatedBy: editingEntry.billCreatedBy,
        cylinderType: editingEntry.cylinderType,
        cylinderLabel: editingEntry.cylinderLabel ?? "",
        deliveredBy: editingEntry.deliveredBy ?? "",
        quantity: editingEntry.quantity,
        unitPrice: editingEntry.unitPrice,
        amount: editingEntry.amount,
        customerName: editingEntry.customerName,
        verified: editingEntry.verified,
        description: editingEntry.description ?? "",
        deliveryDate: editingEntry.deliveryDate,
      }
    : undefined;

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[minmax(340px,0.75fr)_minmax(0,1.25fr)]">
        <div className="min-w-0">
          {editingEntry ? (
            <CylinderForm
              onSubmit={handleUpdate}
              customers={customers}
              initialValues={initialValues}
              onCancel={handleCancelEdit}
            />
          ) : (
            <CylinderForm
              onSubmit={async (values) => {
                // This will be handled by the server action in the page
                router.refresh();
              }}
              customers={customers}
            />
          )}
        </div>
        <div className="min-w-0">
          <CylinderTable
            entries={entries}
            query={query}
            period={period}
            page={page}
            totalPages={totalPages}
            onView={handleView}
            onEdit={handleEdit}
            pageSize={pageSize}
          />
        </div>
      </section>

      <CylinderViewDrawer
        entry={selectedEntry}
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
      />
    </>
  );
}

