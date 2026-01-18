"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCustomer } from "@/app/(dashboard)/add-customer/actions";

const statusBadgeMap: Record<string, string> = {
  ACTIVE: "border-green-200 bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700 hover:border-green-200",
  INACTIVE: "border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200",
};

/**
 * Returns CSS classes for bill type badge
 * @param billType - The bill type ("Cash" or "Credit")
 * @returns CSS classes string
 */
function getBillTypeBadgeClasses(billType: string): string {
  const baseClasses = "rounded-full px-3 py-1 text-xs font-medium";
  if (billType.toLowerCase() === "cash") {
    return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
  } else if (billType.toLowerCase() === "credit") {
    return `${baseClasses} bg-red-100 text-red-700 border border-red-200`;
  }
  // Default styling
  return `${baseClasses} bg-slate-100 text-slate-600`;
}

interface CustomerViewDrawerProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (customerId: string) => void;
}

interface CustomerData {
  id: string;
  customerCode: number;
  name: string;
  contactNumber: string;
  customerType: string;
  cylinderType: string;
  billType: string;
  address?: string | null;
  status: string;
  area?: string | null;
  city?: string | null;
  country?: string | null;
  securityDeposit?: number | null;
  notes?: string | null;
  email?: string | null;
  additionalContacts?: Array<{ name: string; contactNumber: string }> | string | null;
}

export function CustomerViewDrawer({ customerId, open, onOpenChange, onEdit }: CustomerViewDrawerProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, startLoading] = useTransition();

  useEffect(() => {
    if (open && customerId) {
      startLoading(async () => {
        const result = await getCustomer(customerId);
        if (result.success && result.data) {
          setCustomer(result.data as CustomerData);
        }
      });
    }
  }, [open, customerId]);

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg p-0">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <SheetHeader>
            <SheetTitle className="text-2xl font-semibold text-slate-900">Customer Details</SheetTitle>
            <SheetDescription>View complete information about this customer</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
          {/* Customer Code & Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-500">Customer ID</label>
                <p className="mt-1 text-lg font-semibold text-slate-900">#{customer.customerCode}</p>
              </div>
              <Badge
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-none",
                  statusBadgeMap[customer.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"],
                )}
              >
                {customer.status === "ACTIVE" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500">Customer Name</label>
              <p className="mt-1 text-base font-semibold text-slate-900">{customer.name}</p>
            </div>

            {/* Contact Number - Show first contact with name */}
            {(() => {
              // Parse additionalContacts if it's a string (JSON)
              let contacts: Array<{ name: string; contactNumber: string }> = [];
              if (customer.additionalContacts) {
                if (typeof customer.additionalContacts === 'string') {
                  try {
                    contacts = JSON.parse(customer.additionalContacts);
                  } catch (e) {
                    contacts = [];
                  }
                } else if (Array.isArray(customer.additionalContacts)) {
                  contacts = customer.additionalContacts;
                }
              }
              
              // Filter out invalid contacts (must have both name and contactNumber)
              contacts = contacts.filter(contact => contact?.name && contact?.contactNumber);
              
              // Get first contact if available, otherwise use main contactNumber
              const firstContact = contacts.length > 0 ? contacts[0] : null;
              
              return (
                <div>
                  <label className="text-sm font-medium text-slate-500">Contact Number</label>
                  {firstContact ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-base text-slate-900">
                        <span className="font-semibold">{firstContact.name}</span>
                        {" - "}
                        <span className="text-slate-600">{firstContact.contactNumber}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-base text-slate-900">{customer.contactNumber}</p>
                  )}
                </div>
              );
            })()}

            {/* Additional Contacts - Show remaining contacts (skip first one) */}
            {(() => {
              // Parse additionalContacts if it's a string (JSON)
              let contacts: Array<{ name: string; contactNumber: string }> = [];
              if (customer.additionalContacts) {
                if (typeof customer.additionalContacts === 'string') {
                  try {
                    contacts = JSON.parse(customer.additionalContacts);
                  } catch (e) {
                    contacts = [];
                  }
                } else if (Array.isArray(customer.additionalContacts)) {
                  contacts = customer.additionalContacts;
                }
              }
              
              // Filter out invalid contacts (must have both name and contactNumber)
              contacts = contacts.filter(contact => contact?.name && contact?.contactNumber);
              
              // Skip the first contact (already shown above)
              const remainingContacts = contacts.length > 1 ? contacts.slice(1) : [];
              
              return remainingContacts.length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-slate-500">Additional Contacts</label>
                  <div className="mt-2 space-y-1">
                    {remainingContacts.map((contact, index) => (
                      <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm text-slate-900">
                          <span className="font-semibold">{contact.name}</span>
                          {" - "}
                          <span className="text-slate-600">{contact.contactNumber}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {customer.email && (
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="mt-1 text-base text-slate-900">{customer.email}</p>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500">Customer Type</label>
              <p className="mt-1 text-base text-slate-900">{customer.customerType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">Cylinder Type</label>
              <p className="mt-1 text-base text-slate-900">{customer.cylinderType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">Bill Type</label>
              <p className="mt-1 text-base text-slate-900">
                <span className={getBillTypeBadgeClasses(customer.billType)}>
                  {customer.billType}
                </span>
              </p>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500">Address</label>
              <p className="mt-1 whitespace-pre-line text-base text-slate-900">{customer.address ?? "—"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {customer.area && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Area</label>
                  <p className="mt-1 text-base text-slate-900">{customer.area}</p>
                </div>
              )}
              {customer.city && (
                <div>
                  <label className="text-sm font-medium text-slate-500">City</label>
                  <p className="mt-1 text-base text-slate-900">{customer.city}</p>
                </div>
              )}
              {customer.country && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Country</label>
                  <p className="mt-1 text-base text-slate-900">{customer.country}</p>
                </div>
              )}
              {customer.securityDeposit !== null && customer.securityDeposit !== undefined && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Security Deposit</label>
                  <p className="mt-1 text-base text-slate-900">
                    {Intl.NumberFormat("en-PK", {
                      style: "currency",
                      currency: "PKR",
                      maximumFractionDigits: 0,
                    }).format(customer.securityDeposit)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes - Show after Security Deposit */}
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-500">Notes</label>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-900">
                {customer.notes && customer.notes.trim() !== "" ? customer.notes : "—"}
              </p>
            </div>
          </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (onEdit) {
                onEdit(customerId);
              } else {
                // Fallback: try to navigate (though route doesn't exist)
                router.push(`/add-customer/${customerId}/edit`);
              }
            }}
            className="rounded-xl"
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit Customer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

