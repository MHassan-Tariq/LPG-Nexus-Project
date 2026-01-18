"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatNumber, formatCurrency } from "@/lib/utils";

import { deleteInventoryItem } from "@/app/(dashboard)/inventory/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { InventoryEntry } from "./inventory-table";

interface InventoryTableClientProps {
  entries: InventoryEntry[];
}

export function InventoryTableClient({ entries }: InventoryTableClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryEntry | null>(null);
  const [isDeleting, startDeleting] = useTransition();
  const selectedEntry = useMemo(() => entries.find((entry) => entry.id === selectedId) ?? null, [entries, selectedId]);

  function openDetails(entryId: string) {
    setSelectedId(entryId);
  }

  function closeDetails() {
    setSelectedId(null);
  }

  function beginEdit(entry: InventoryEntry) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inventory:edit", { detail: entry }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function confirmDelete(entry: InventoryEntry) {
    setDeleteTarget(entry);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDeleting(async () => {
      try {
        await deleteInventoryItem(deleteTarget.id);
        if (selectedId === deleteTarget.id) {
          closeDetails();
        }
        setDeleteTarget(null);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <>
    {isDeleting ? (
      <div className="p-6">
        <TableSkeleton rows={10} columns={11} />
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-wide text-slate-400">
              <TableHead>Cylinder Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price per Cylinder</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Received By</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-sm text-slate-500">
                  No inventory records match your filters.
                </TableCell>
              </TableRow>
            )}

            {(() => {
              // Group entries by date for highlighting (same date = same color)
              function getDateKey(entry: InventoryEntry): string {
                return format(new Date(entry.entryDate), "yyyy-MM-dd");
              }

              // Create a map to assign colors to dates
              const dateColors = new Map<string, string>();
              const colors = ["bg-blue-50/50", "bg-green-50/50", "bg-orange-50/50"]; // Three colors: blue, green, orange
              
              // Get unique dates and sort them
              const uniqueDates = Array.from(new Set(entries.map(getDateKey))).sort();
              
              // Assign colors to dates
              uniqueDates.forEach((dateKey, index) => {
                dateColors.set(dateKey, colors[index % colors.length]);
              });
              
              return entries.map((entry) => {
                const totalPrice = entry.unitPrice !== null && entry.quantity > 0 ? entry.unitPrice * entry.quantity : null;
                const dateKey = getDateKey(entry);
                const rowColor = dateColors.get(dateKey) || "";

                return (
                  <TableRow key={entry.id} className={cn("text-sm", rowColor)}>
                  <TableCell className="font-medium text-slate-900">{entry.cylinderType}</TableCell>
                  <TableCell className="text-slate-700">{entry.category}</TableCell>
                  <TableCell className="text-slate-700">{entry.quantity}</TableCell>
                  <TableCell className="text-slate-700 font-medium whitespace-nowrap">
                    {entry.unitPrice !== null ? formatCurrency(entry.unitPrice) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-900 font-semibold whitespace-nowrap">
                    {totalPrice !== null ? formatCurrency(totalPrice) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-700">{entry.vendor}</TableCell>
                  <TableCell className="text-slate-600">{entry.receivedBy}</TableCell>
                  <TableCell className="text-slate-500">
                    {entry.description
                      ? entry.description.length > 15
                        ? `${entry.description.slice(0, 15)}…`
                        : entry.description
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        entry.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {entry.verified ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{format(new Date(entry.entryDate), "dd-MM-yyyy")}</TableCell>
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={80}>
                    <div className="flex items-center justify-end gap-2">
                      <ActionIcon
                        icon={<Eye className="h-4 w-4" />}
                        label="View"
                        onClick={() => openDetails(entry.id)}
                      />
                      <ActionIcon
                        icon={<Pencil className="h-4 w-4" />}
                        label="Update"
                        onClick={() => beginEdit(entry)}
                      />
                      <ActionIcon
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete"
                        tone="destructive"
                        onClick={() => confirmDelete(entry)}
                      />
                    </div>
                  </TooltipProvider>
                </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </div>
    )}

      <Sheet open={Boolean(selectedEntry)} onOpenChange={(open) => !open && closeDetails()}>
        <SheetContent side="right" className="w-full max-w-xl border-l border-[#eef1f8] bg-white">
          {selectedEntry && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>Inventory Entry — {selectedEntry.cylinderType}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <DetailRow label="Cylinder Type" value={selectedEntry.cylinderType} />
                <DetailRow label="Category" value={selectedEntry.category} />
                <DetailRow label="Quantity" value={String(selectedEntry.quantity)} />
                {selectedEntry.unitPrice !== null && (
                  <>
                    <DetailRow
                      label="Price per Cylinder"
                      value={new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0,
                      }).format(selectedEntry.unitPrice)}
                    />
                    <DetailRow
                      label="Total Price"
                      value={new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0,
                      }).format(selectedEntry.unitPrice * selectedEntry.quantity)}
                    />
                  </>
                )}
                <DetailRow label="Vendor" value={selectedEntry.vendor} />
                <DetailRow label="Received By" value={selectedEntry.receivedBy} />
                <DetailRow
                  label="Verified"
                  value={
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        selectedEntry.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {selectedEntry.verified ? "Yes" : "No"}
                    </Badge>
                  }
                />
                <DetailRow label="Entry Date" value={format(new Date(selectedEntry.entryDate), "dd-MM-yyyy")} />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Description</p>
                  <p className="mt-2 rounded-2xl bg-[#f7f9ff] px-4 py-3 text-sm font-medium text-slate-700">
                    {selectedEntry.description ?? "No description provided."}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedEntry) {
                      beginEdit(selectedEntry);
                      closeDetails();
                    }
                  }}
                  className="h-12 flex-1 rounded-[18px] border-[#dde3f0] bg-white text-sm font-semibold text-slate-600 shadow-none hover:bg-slate-50"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Entry
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inventory entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected cylinder record will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function ActionIcon({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  tone?: "default" | "destructive";
}) {
  const styles =
    tone === "destructive"
      ? "bg-rose-500/20 text-rose-600 hover:bg-rose-500/30"
      : "bg-[#eef2ff] text-[#1c2a6d] hover:bg-[#e0e7ff]";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
            styles,
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{label}</TooltipContent>
    </Tooltip>
  );
}


