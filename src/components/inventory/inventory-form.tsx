"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createInventoryItem, updateInventoryItem } from "@/app/(dashboard)/inventory/actions";
import { inventoryFormSchema, type InventoryFormValues } from "@/lib/validations/inventory";
import type { InventoryEntry } from "@/components/inventory/inventory-table";
import { getTodayDate, formatNumber, parseFormattedNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CYLINDER_TYPES = ["12kg Domestic", "35kg Business", "45kg Commercial", "Industrial"];
const CATEGORIES = ["Domestic", "Commercial", "Industrial", "General"];
const RECEIVERS = ["Tariq SB", "Ashraf SB", "Arif SB", "Custom"];

function defaultFormValues(category: string = "Domestic", receiver: string = RECEIVERS[0]): InventoryFormValues {
  return {
    entries: [
      {
        cylinderType: "",
        category,
        quantity: 1,
        unitPrice: null,
      },
    ],
    vendor: "",
    description: "",
    entryDate: getTodayDate(),
    verified: false,
    receivedBy: receiver,
  };
}

export function InventoryForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<InventoryEntry | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(editingEntry);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: defaultFormValues(),
  });

  useEffect(() => {
    function handleEdit(event: Event) {
      const customEvent = event as CustomEvent<InventoryEntry>;
      const entry = customEvent.detail;
      if (!entry) return;
      setEditingEntry(entry);
      setSuccess(null);
      form.reset({
        entries: [
          {
            cylinderType: entry.cylinderType,
            category: entry.category,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice ?? null,
          },
        ],
        vendor: entry.vendor,
        description: entry.description ?? "",
        entryDate: new Date(entry.entryDate),
        verified: entry.verified,
        receivedBy: entry.receivedBy,
      });
    }

    window.addEventListener("inventory:edit", handleEdit as EventListener);
    return () => window.removeEventListener("inventory:edit", handleEdit as EventListener);
  }, [form]);

  function onSubmit(values: InventoryFormValues) {
    setSuccess(null);
    startTransition(async () => {
      const firstEntry = values.entries[0];
      if (!firstEntry) return;

      if (editingEntry) {
        await updateInventoryItem(editingEntry.id, {
          cylinderType: firstEntry.cylinderType,
          category: firstEntry.category,
          quantity: firstEntry.quantity,
          unitPrice: firstEntry.unitPrice,
          vendor: values.vendor,
          description: values.description ?? "",
          entryDate: values.entryDate,
          verified: values.verified ?? false,
          receivedBy: values.receivedBy,
        });
        toast.warning("Inventory record updated successfully.");
        setSuccess("Inventory record updated.");
        setEditingEntry(null);
        form.reset(defaultFormValues(firstEntry.category, values.receivedBy));
        return;
      }

      await createInventoryItem(values);
      toast.success("Inventory record added successfully.");
      setSuccess("Inventory record added.");
      form.reset(defaultFormValues(firstEntry.category, values.receivedBy));
    });
  }

  function handleClear() {
    setSuccess(null);
    setEditingEntry(null);
    form.reset(defaultFormValues());
  }

  return (
    <div className="rounded-[32px] border border-[#e4eaf4] bg-white px-5 py-6 shadow-sm lg:px-7">
      <div className="space-y-1 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {isEditing ? "Update Inventory Record" : "Add Cylinder Type & Quantity"}
        </h2>
        <p className="text-sm text-slate-500">
          {isEditing ? "Editing an existing entry. Save or cancel to return to add mode." : "Enter the delivery or receiving details."}
        </p>
        {isEditing && editingEntry && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#ffe4c7] bg-[#fff5eb] px-4 py-3 text-sm">
            <span className="font-medium text-[#a35500]">
              Editing: {editingEntry.cylinderType} — {editingEntry.vendor}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 rounded-full border border-[#fbd1a7] bg-white px-3 text-xs font-semibold text-[#a35500]"
            >
              Cancel edit
            </Button>
          </div>
        )}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">Categories & Quantity</p>
              <Button
                type="button"
                variant="outline"
                disabled={isEditing}
                onClick={() =>
                  form.setValue("entries", [
                    ...form.getValues("entries"),
                    { cylinderType: "", category: "Domestic", quantity: 1, unitPrice: null },
                  ])
                }
                className="h-9 rounded-[16px] border-[#dfe4f4] text-xs font-semibold text-slate-600 disabled:opacity-60"
              >
                + Add Type
              </Button>
            </div>
            {form.watch("entries").map((entry, index) => (
              <div key={index} className="space-y-3 rounded-[20px] border border-[#dde3f0] bg-[#f7f8fe] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Category</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-10 rounded-[14px] border border-transparent bg-white text-sm font-medium text-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-lg">
                              {CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category} className="text-sm font-medium text-slate-700">
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`entries.${index}.cylinderType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Cylinder Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-10 rounded-[14px] border border-transparent bg-white text-sm font-medium text-slate-700">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-lg">
                              {CYLINDER_TYPES.map((type) => (
                                <SelectItem key={type} value={type} className="text-sm font-medium text-slate-700">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter quantity"
                            className="h-10 rounded-[14px] border border-transparent bg-white text-sm font-medium text-slate-700"
                            value={field.value ? formatNumber(field.value) : ""}
                            onChange={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              field.onChange(numValue >= 1 ? numValue : 1);
                            }}
                            onBlur={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              const finalValue = numValue >= 1 ? numValue : 1;
                              field.onChange(finalValue);
                              e.target.value = formatNumber(finalValue);
                              field.onBlur();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`entries.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Price of One Cylinder</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="0.00"
                            className="h-10 rounded-[14px] border border-transparent bg-white text-sm font-medium text-slate-700"
                            {...field}
                            value={field.value ? formatNumber(field.value) : ""}
                            onChange={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              field.onChange(numValue >= 0 ? numValue : 0);
                            }}
                            onBlur={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              const finalValue = numValue >= 0 ? numValue : 0;
                              field.onChange(finalValue);
                              if (finalValue > 0) {
                                e.target.value = formatNumber(finalValue);
                              } else {
                                e.target.value = "";
                              }
                              field.onBlur();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Total Display */}
                {(() => {
                  const quantity = form.watch(`entries.${index}.quantity`) ?? 0;
                  const unitPrice = form.watch(`entries.${index}.unitPrice`) ?? null;
                  const total = unitPrice !== null && quantity > 0 ? unitPrice * quantity : null;
                  return (
                    total !== null && (
                      <div className="rounded-[14px] bg-blue-50 px-3 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-blue-900">Total:</span>
                          <span className="font-semibold text-blue-700">
                            {new Intl.NumberFormat("en-PK", {
                              style: "currency",
                              currency: "PKR",
                              maximumFractionDigits: 0,
                            }).format(total)}
                          </span>
                        </div>
                      </div>
                    )
                  );
                })()}
                {!isEditing && form.watch("entries").length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-rose-500"
                      onClick={() =>
                        form.setValue(
                          "entries",
                          form.getValues("entries").filter((_, idx) => idx !== index),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter vendor name"
                    className="h-12 rounded-[18px] border-[#dde3f0] bg-[#f7f8fe] text-sm font-medium text-slate-700"
                    {...field}
                    onChange={(e) => {
                      // Remove numbers and only allow letters, spaces, and common punctuation
                      const value = e.target.value.replace(/[0-9]/g, "");
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter description"
                    className="min-h-[96px] rounded-[18px] border-[#dde3f0] bg-[#f7f8fe] text-sm text-slate-700"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ReceivedByField form={form} />

          <FormField
            control={form.control}
            name="verified"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-[18px] border border-[#dde3f0] bg-[#f7f8fe] px-4 py-3">
                <FormLabel className="m-0 text-sm">Verified</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <DatePickerWithInput
                  date={field.value}
                  onChange={field.onChange}
                  className="rounded-[18px] border-[#dde3f0] bg-[#f7f8fe]"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="h-12 rounded-[18px] border border-slate-200 text-sm font-semibold text-slate-600"
            >
              Clear
            </Button>
            <Button type="submit" loading={isPending} className="h-12 rounded-[18px] bg-[#1c5bff] text-white">
              {isEditing ? "Update Entry" : "Add"}
            </Button>
          </div>
          {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}
        </form>
      </Form>
    </div>
  );
}

function ReceivedByField({ form }: { form: UseFormReturn<InventoryFormValues> }) {
  const [custom, setCustom] = useState(false);
  const currentValue = form.watch("receivedBy");

  useEffect(() => {
    if (!currentValue) {
      setCustom(true);
      return;
    }
    setCustom(!RECEIVERS.includes(currentValue));
  }, [currentValue]);

  return (
    <FormField
      control={form.control}
      name="receivedBy"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Received Cylinder By</FormLabel>
          <FormControl>
            <>
              <Select
                value={custom ? "Custom" : field.value}
                onValueChange={(value) => {
                  if (value === "Custom") {
                    setCustom(true);
                    field.onChange("");
                  } else {
                    setCustom(false);
                    field.onChange(value);
                  }
                }}
              >
                <SelectTrigger className="h-12 rounded-[18px] border-[#dde3f0] bg-[#f7f8fe] text-sm font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-lg">
                  {RECEIVERS.map((receiver) => (
                    <SelectItem key={receiver} value={receiver} className="text-sm font-medium text-slate-700">
                      {receiver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {custom && (
                <Input
                  className="mt-3 h-11 rounded-[16px] border-[#dde3f0] bg-white text-sm text-slate-700"
                  placeholder="Enter receiver name"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              )}
            </>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

