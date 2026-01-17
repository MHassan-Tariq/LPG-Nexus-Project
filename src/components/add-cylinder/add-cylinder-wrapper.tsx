"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { CylinderForm, CylinderFormValues } from "./cylinder-form";
import { CylinderTable, CylinderEntryRow } from "./cylinder-table";
import { CylinderViewDrawer } from "./cylinder-view-drawer";
import { updateCylinderEntry } from "@/app/add-cylinder/actions";
import { CylinderCustomerOption } from "./cylinder-form";
import { useEditPermission } from "@/hooks/use-edit-permission";
import { ViewOnlyWrapper } from "@/components/permissions/permission-guard";

interface CustomerCylinderSummaryData {
  customerId: string | null;
  customerName: string;
  customerCode: number | null;
  totalDelivered: number;
  totalReceived: number;
  remaining: number;
}

interface AddCylinderWrapperProps {
  entries: CylinderEntryRow[];
  query: string;
  period: string;
  page: number;
  totalPages: number;
  pageSize: number | string;
  customers: CylinderCustomerOption[];
  customerSummaries?: CustomerCylinderSummaryData[];
  onCreateSubmit: (values: CylinderFormValues) => Promise<{ success: boolean; id?: string; error?: string } | void>;
}

export function AddCylinderWrapper({
  entries,
  query,
  period,
  page,
  totalPages,
  pageSize,
  customers,
  customerSummaries = [],
  onCreateSubmit,
}: AddCylinderWrapperProps) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<CylinderEntryRow | null>(null);
  const [groupEntriesForView, setGroupEntriesForView] = useState<CylinderEntryRow[]>([]);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CylinderEntryRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const { canEdit } = useEditPermission("addCylinder");

  function handleCustomerSelect(customerNameOrLabel: string) {
    // Update URL to filter table by customer
    // The customerNameOrLabel could be just the name or the full format "ID · Name"
    // Find the matching customer to get the full label format
    const matchingCustomer = customers.find((c) => 
      c.name === customerNameOrLabel || 
      `${c.customerCode} · ${c.name}` === customerNameOrLabel ||
      customerNameOrLabel.includes(c.name)
    );
    
    // Use the full format if customer found, otherwise use what was passed
    const customerLabel = matchingCustomer 
      ? `${matchingCustomer.customerCode} · ${matchingCustomer.name}`
      : customerNameOrLabel;
    
    const params = new URLSearchParams(window.location.search);
    params.set("q", customerLabel);
    params.set("page", "1");
    // Preserve period and pageSize if they exist
    if (period) params.set("period", period);
    if (pageSize) params.set("pageSize", String(pageSize));
    // Clear type filter when selecting customer to show all types
    params.delete("type");
    router.push(`/add-cylinder?${params.toString()}`);
  }

  function handleView(entry: CylinderEntryRow) {
    // Find all entries (DELIVERED and RECEIVED) in the same date/customer/cylinderLabel/unitPrice group
    // DELIVERED entries are grouped by date/customer/label/price, RECEIVED by date/customer/label
    const entryDateKey = entry.deliveryDate ? format(entry.deliveryDate, "yyyy-MM-dd") : "no-date";
    const entryCylinderLabel = entry.cylinderLabel || "";
    const entryUnitPrice = entry.unitPrice ?? 0;
    const groupEntries = entries.filter((e) => {
      const eDateKey = e.deliveryDate ? format(e.deliveryDate, "yyyy-MM-dd") : "no-date";
      const eCylinderLabel = e.cylinderLabel || "";
      
      if (entry.cylinderType === "DELIVERED" && e.cylinderType === "DELIVERED") {
        // For DELIVERED entries, match by date/customer/label/price
        const eUnitPrice = e.unitPrice ?? 0;
        return eDateKey === entryDateKey && 
               e.customerName === entry.customerName &&
               eCylinderLabel === entryCylinderLabel &&
               eUnitPrice === entryUnitPrice;
      } else if (entry.cylinderType === "RECEIVED" && e.cylinderType === "RECEIVED") {
        // For RECEIVED entries, match by date/customer/label/price (same as DELIVERED)
        const eUnitPrice = e.unitPrice ?? 0;
        return eDateKey === entryDateKey && 
               e.customerName === entry.customerName &&
               eCylinderLabel === entryCylinderLabel &&
               eUnitPrice === entryUnitPrice;
      } else {
        // Mixed types: match by date/customer/label/price (RECEIVED entries must match specific DELIVERED entries)
        const eUnitPrice = e.unitPrice ?? 0;
        return eDateKey === entryDateKey && 
               e.customerName === entry.customerName &&
               eCylinderLabel === entryCylinderLabel &&
               eUnitPrice === entryUnitPrice;
      }
    });
    
    // Store all group entries for the view drawer to display
    setSelectedEntry(entry);
    setGroupEntriesForView(groupEntries);
    setViewDrawerOpen(true);
    setEditingEntry(null); // Clear edit mode when viewing
  }

  function handleEdit(entry: CylinderEntryRow) {
    if (!canEdit) {
      // Don't allow editing if user doesn't have permission
      return;
    }
    
    // Always edit the entry that was clicked (the row shows DELIVERED entries, so edit DELIVERED)
    // RECEIVED entries can be edited through the view drawer
    setEditingEntry(entry);
    setViewDrawerOpen(false); // Close drawer when editing
  }

  function handleCancelEdit() {
    setEditingEntry(null);
  }

  async function handleUpdate(values: CylinderFormValues) {
    if (!editingEntry) {
      throw new Error("No entry selected for editing");
    }

    try {
      const result = await updateCylinderEntry(editingEntry.id, values);
      if (!result.success) {
        const errorMsg = result.error || "Failed to update cylinder entry";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      toast.warning(
        values.cylinderType === "RECEIVED"
          ? "Received cylinder updated successfully."
          : "Delivered cylinder updated successfully."
      );
      
      // Clear editingEntry so form clears after successful update
      setEditingEntry(null);
      
      // Force a refresh to show updated data in the table
      // Preserve the current query parameters (customer filter) when refreshing
      startTransition(() => {
        // Preserve query parameters when refreshing
        const params = new URLSearchParams(window.location.search);
        // Ensure customer query is preserved
        if (query) {
          params.set("q", query);
        }
        // Preserve other params
        if (period) params.set("period", period);
        if (pageSize) params.set("pageSize", String(pageSize));
        params.set("page", "1"); // Reset to first page after edit
        router.push(`/add-cylinder?${params.toString()}`);
      });
    } catch (error) {
      console.error("Error in handleUpdate:", error);
      throw error; // Re-throw to let form handle it
    }
  }

  // Convert editing entry to initial values
  // Include a hidden identifier to help track which entry is being edited
  const initialValues: Partial<CylinderFormValues> & { _entryId?: string } | undefined = editingEntry
    ? {
        _entryId: editingEntry.id, // Include entry ID for reliable tracking
        billCreatedBy: editingEntry.billCreatedBy ?? "",
        cylinderType: editingEntry.cylinderType,
        cylinderLabel: editingEntry.cylinderLabel ?? "",
        deliveredBy: editingEntry.deliveredBy ?? "",
        quantity: editingEntry.quantity ?? undefined,
        unitPrice: editingEntry.cylinderType === "RECEIVED" ? undefined : (editingEntry.unitPrice ?? undefined),
        amount: editingEntry.amount ?? undefined,
        customerName: editingEntry.customerName ?? "",
        verified: editingEntry.verified ?? false,
        description: editingEntry.description ?? "",
        deliveryDate: editingEntry.deliveryDate,
        // RECEIVED type fields - properly handle null/undefined values
        // For RECEIVED entries, paymentType should be undefined if not set (checkbox controls visibility)
        paymentType: editingEntry.cylinderType === "RECEIVED" 
          ? (editingEntry.paymentType as any) ?? undefined
          : undefined,
        paymentAmount: editingEntry.paymentAmount ?? (editingEntry.cylinderType === "RECEIVED" ? 0 : undefined),
        paymentReceivedBy: editingEntry.paymentReceivedBy ?? "",
        emptyCylinderReceived: editingEntry.cylinderType === "RECEIVED" 
          ? (editingEntry.emptyCylinderReceived !== null && editingEntry.emptyCylinderReceived !== undefined 
              ? editingEntry.emptyCylinderReceived 
              : (editingEntry.quantity && editingEntry.quantity > 0 ? editingEntry.quantity : 1))
          : undefined,
      }
    : undefined;

  async function handleFormSubmit(values: CylinderFormValues) {
    if (!canEdit) {
      // Don't submit if user doesn't have edit permission
      return;
    }
    console.log("handleFormSubmit called, editingEntry:", editingEntry?.id);
    if (editingEntry) {
      try {
        console.log("Updating entry:", editingEntry.id);
        await handleUpdate(values);
        console.log("Update successful");
        // router.refresh() is called in handleUpdate
      } catch (error) {
        console.error("Error updating entry:", error);
        throw error; // Re-throw to let form handle it
      }
    } else {
      console.log("Creating new entry");
      const result = await onCreateSubmit(values);
      
      // Check if the result indicates failure
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        const errorMessage = 'error' in result ? result.error : "Failed to create cylinder entry.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Show success toast
      toast.success(
        values.cylinderType === "RECEIVED"
          ? "Received cylinder saved successfully."
          : "Delivered cylinder saved successfully."
      );
      
      // After creating entry, refresh the page to show it in the table
      // Preserve query parameters (customer filter, period, etc.)
      startTransition(() => {
        const params = new URLSearchParams(window.location.search);
        // Preserve customer query if it exists
        if (query) {
          params.set("q", query);
        }
        // Preserve other params
        if (period) params.set("period", period);
        if (pageSize) params.set("pageSize", String(pageSize));
        params.set("page", "1"); // Reset to first page to show new entry
        // Clear type filter to show all entries after saving
        params.delete("type");
        router.push(`/add-cylinder?${params.toString()}`);
      });
    }
  }

  return (
    <ViewOnlyWrapper moduleId="addCylinder">
      <section className="grid gap-6 lg:grid-cols-[minmax(340px,0.75fr)_minmax(0,1.25fr)]">
        <div className="min-w-0">
          <CylinderForm
            onSubmit={handleFormSubmit}
            customers={customers}
            initialValues={initialValues}
            onCancel={editingEntry ? handleCancelEdit : undefined}
            onCustomerSelect={handleCustomerSelect}
            disabled={!canEdit}
          />
        </div>
        <div className="min-w-0">
          <CylinderTable
            entries={entries}
            query={query}
            period={period}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            customers={customers}
            canEdit={canEdit}
            customerSummaries={customerSummaries}
          />
        </div>
      </section>

      <CylinderViewDrawer
        entry={selectedEntry}
        groupEntries={groupEntriesForView}
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        onEdit={canEdit ? (entry) => {
          setViewDrawerOpen(false);
          handleEdit(entry);
        } : undefined}
      />
    </ViewOnlyWrapper>
  );
}

