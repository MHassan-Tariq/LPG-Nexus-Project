"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CustomerFormDrawer, CustomerFormValues } from "./customer-form-drawer";
import { CustomerTableClient, CustomerRow } from "./customer-table-client";
import { CustomerSearchBar } from "./customer-search-bar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCustomer, updateCustomer } from "@/app/add-customer/actions";

interface CustomerTableWrapperProps {
  customers: CustomerRow[];
  query: string;
  page: number;
  totalPages: number;
  pageSize: number | string;
  onCreateCustomer: (values: CustomerFormValues) => Promise<void>;
  nextCustomerCode: number;
  basePath?: string;
}

export function CustomerTableWrapper({
  customers,
  query,
  page,
  totalPages,
  pageSize,
  onCreateCustomer,
  nextCustomerCode,
  basePath = "/add-customer",
}: CustomerTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingCustomerData, setEditingCustomerData] = useState<any | null>(null);
  const [isFetchingCustomer, startFetchingCustomer] = useTransition();

  // Fetch customer data when editing
  useEffect(() => {
    if (editingCustomerId) {
      startFetchingCustomer(async () => {
        const result = await getCustomer(editingCustomerId);
        if (result.success && result.data) {
          const customer = result.data;
          // Transform customer data to form values
          setEditingCustomerData({
            id: customer.id,
            customerCode: customer.customerCode,
            name: customer.name,
            contactNumber: customer.contactNumber,
            customerType: customer.customerType,
            cylinderType: customer.cylinderType,
            billType: customer.billType,
            securityDeposit: customer.securityDeposit,
            area: customer.area,
            city: customer.city,
            country: customer.country,
            address: customer.address,
            notes: customer.notes,
            additionalContacts: Array.isArray(customer.additionalContacts) && (customer.additionalContacts as any[]).length > 0
              ? customer.additionalContacts
              : [{ name: "", contactNumber: customer.contactNumber || "" }],
            status: customer.status,
            email: customer.email,
          });
        } else {
          console.error("Failed to fetch customer for editing:", result.error);
          setEditingCustomerId(null);
        }
      });
    } else {
      setEditingCustomerData(null);
    }
  }, [editingCustomerId, startFetchingCustomer]);

  async function handleCreate(values: CustomerFormValues) {
    try {
      console.log("handleCreate called with:", values);
      await onCreateCustomer(values);
      console.log("Customer created successfully");
      toast.success("Customer created successfully.");
      setAddDrawerOpen(false);
      // Preserve current page and other params when refreshing
      const currentParams = new URLSearchParams(searchParams.toString());
      // Keep current page, query, and pageSize
      const params = new URLSearchParams();
      if (currentParams.get('page')) params.set('page', currentParams.get('page')!);
      if (currentParams.get('q')) params.set('q', currentParams.get('q')!);
      if (currentParams.get('pageSize')) params.set('pageSize', currentParams.get('pageSize')!);
      router.push(`/add-customer${params.toString() ? `?${params.toString()}` : ''}`);
    } catch (error: any) {
      console.error("Error in handleCreate:", error);
      throw error; // Re-throw to let the form handle it
    }
  }

  async function handleUpdate(values: CustomerFormValues) {
    if (!editingCustomerId) return;
    
    const result = await updateCustomer(editingCustomerId, values);
    if (result.success) {
      toast.warning("Customer updated successfully.");
      // Preserve current page and other params
      const currentParams = new URLSearchParams(searchParams.toString());
      const params = new URLSearchParams();
      if (currentParams.get('page')) params.set('page', currentParams.get('page')!);
      if (currentParams.get('q')) params.set('q', currentParams.get('q')!);
      if (currentParams.get('pageSize')) params.set('pageSize', currentParams.get('pageSize')!);
      
      // Don't close immediately - let the form drawer show success message
      // The drawer will close itself after showing the message
      setTimeout(() => {
        setEditingCustomerId(null);
        setEditingCustomerData(null);
        router.push(`/add-customer${params.toString() ? `?${params.toString()}` : ''}`);
      }, 2000);
    } else {
      toast.error(result.error || "Failed to update customer");
    }
  }

  function handleEdit(customer: CustomerRow) {
    setEditingCustomerId(customer.id);
  }

  function handleCancelEdit() {
    setEditingCustomerId(null);
    setEditingCustomerData(null);
  }

  return (
    <>
      <Card className="rounded-[32px] border border-[#e5eaf4] bg-white shadow-none">
        <CardHeader className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Customer Directory</p>
              <h3 className="text-xl font-semibold text-slate-900">Customer List</h3>
            </div>
            <div className="ml-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              <CustomerSearchBar
                query={query}
                searchParamKey="q"
                pageParamKey="page"
                basePath={basePath}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => setAddDrawerOpen(true)}
                  className="rounded-xl bg-[#1c5bff] px-5 py-2 text-sm font-semibold hover:bg-[#1647c4]"
                >
                  + Add Customer
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CustomerTableClient
          customers={customers}
          query={query}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          basePath={basePath}
          onEdit={handleEdit}
        />
      </Card>

      {/* Add Customer Drawer */}
      <CustomerFormDrawer
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        onSubmit={handleCreate}
        nextCustomerCode={nextCustomerCode}
        mode="add"
      />

      {/* Edit Customer Drawer */}
      {editingCustomerData && (
        <CustomerFormDrawer
          open={!!editingCustomerId}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit();
            }
          }}
          onSubmit={handleUpdate}
          nextCustomerCode={nextCustomerCode}
          initialValues={editingCustomerData}
          mode="edit"
          onCancel={handleCancelEdit}
        />
      )}
    </>
  );
}

