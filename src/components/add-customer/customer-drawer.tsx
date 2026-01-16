"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DEFAULT_CUSTOMER_TYPE = "Domestic";
const createEmptyAdditionalContacts = () => [];
const sectionCardClasses = "space-y-4";

const cylinderTypes = ["12kg (Domestic cylinder)", "35kg (Business cylinder)", "45kg (Commercial cylinder)"];
const billTypes = ["Cash", "Credit"];

const formSchema = z.object({
  name: z.string().min(2).max(80),
  contactNumber: z
    .string()
    .min(6)
    .max(32)
    .regex(/^\d+$/, "Contact number must contain only digits"),
  customerType: z.string().min(2).max(48).default(DEFAULT_CUSTOMER_TYPE),
  cylinderType: z.string().min(2).max(64),
  billType: z.string().min(2).max(32),
  securityDeposit: z.coerce.number().int().min(0),
  area: z.string().min(2).max(80),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  address: z.string().min(5).max(200),
  notes: z.string().max(200).optional().nullable(),
  additionalContacts: z
    .array(
      z.object({
        name: z.string().min(2).max(80),
        contactNumber: z
          .string()
          .min(6)
          .max(32)
          .regex(/^\d+$/, "Contact number must contain only digits"),
      }),
    )
    .optional()
    .default(createEmptyAdditionalContacts()),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CustomerFormValues = z.infer<typeof formSchema>;

interface AddCustomerDrawerProps {
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  nextCustomerCode: number;
}

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function AddCustomerDrawer({ onSubmit, nextCustomerCode }: AddCustomerDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactNumber: "",
      customerType: DEFAULT_CUSTOMER_TYPE,
      cylinderType: cylinderTypes[0],
      billType: "Credit",
      securityDeposit: 0,
      area: "",
      city: "faisalabad",
      country: "Pakistan",
      address: "",
      notes: "",
      additionalContacts: createEmptyAdditionalContacts(),
      status: "ACTIVE",
    },
  });

  const contactsArray = useFieldArray({
    control: form.control,
    name: "additionalContacts",
  });

  const contactsError = form.formState.errors.additionalContacts as { message?: string };

  const handleSubmit = (values: CustomerFormValues) => {
    const sanitizedContacts =
      values.additionalContacts
        ?.map((contact) => ({
          name: contact.name.trim(),
          contactNumber: contact.contactNumber.trim(),
        }))
        .filter((contact) => contact.name && contact.contactNumber) ?? [];

    if (sanitizedContacts.length === 0) {
      form.setError("additionalContacts", {
        type: "manual",
        message: "Add at least one contact person.",
      } as any);
      return;
    }

    const payload: CustomerFormValues = {
      ...values,
      contactNumber: sanitizedContacts[0].contactNumber,
      additionalContacts: sanitizedContacts,
    };

    setSuccessMessage(null);
    startTransition(async () => {
      await onSubmit(payload);
      setSuccessMessage("Customer saved successfully.");
      form.reset({
        name: "",
        contactNumber: "",
        customerType: DEFAULT_CUSTOMER_TYPE,
        cylinderType: cylinderTypes[0],
        billType: "Credit",
        securityDeposit: 0,
          area: "",
          city: "faisalabad",
          country: "Pakistan",
          address: "",
          notes: "",
          additionalContacts: createEmptyAdditionalContacts(),
          status: "ACTIVE",
        });
        setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-xl bg-[#1c5bff] px-5 py-2 text-sm font-semibold hover:bg-[#1647c4]">
          + Add Customer
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-4xl border-l border-[#e5eaf4] bg-white px-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-8 py-6">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-2xl font-semibold text-slate-900">Add New Customer</SheetTitle>
              <p className="text-sm text-slate-500">Fill in the customer details below</p>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <section className={sectionCardClasses}>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Customer ID</p>
                    <p className="text-2xl font-semibold text-slate-900">#{nextCustomerCode}</p>
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter customer name"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className={sectionCardClasses}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">Contact Persons</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => {
                        contactsArray.append({ name: "", contactNumber: "" });
                        form.clearErrors("additionalContacts");
                      }}
                    >
                      + Add Contact
                    </Button>
                  </div>
                  {contactsArray.fields.length === 0 && null}
                  {contactsError?.message && <p className="text-sm text-red-500">{contactsError.message}</p>}
                  <div className="space-y-4">
                    {contactsArray.fields.map((field, index) => (
                      <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">Contact {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto px-3 py-1 text-xs text-red-500"
                            onClick={() => contactsArray.remove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <FormField
                            control={form.control}
                            name={`additionalContacts.${index}.name` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter contact name"
                                    className="h-11 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`additionalContacts.${index}.contactNumber` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="+92 300 0000000"
                                  className="h-11 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                                  value={field.value ?? ""}
                                  onChange={(event) =>
                                    field.onChange(event.target.value.replace(/[^0-9]/g, ""))
                                  }
                                />
                              </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={sectionCardClasses}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cylinderType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cylinder Type *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700">
                                <SelectValue placeholder="Select cylinder" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-lg">
                              {cylinderTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-sm text-slate-700">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="billType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bill Type *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700">
                                <SelectValue placeholder="Select bill type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-lg">
                              {billTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-sm text-slate-700">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="securityDeposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cylinder Security Deposit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="1000"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className={sectionCardClasses}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter area"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter city"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Pakistan"
                            className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                            {...field}
                            value={field.value ?? "Pakistan"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Enter complete address"
                            className="rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className={sectionCardClasses}>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Add any additional notes"
                            className="rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div>
                            <FormLabel className="text-sm font-semibold text-slate-900">Active Status</FormLabel>
                            <p className="text-xs text-slate-500">Enable customer account</p>
                          </div>
                          <Switch
                            checked={field.value === "ACTIVE"}
                            onCheckedChange={(checked) => field.onChange(checked ? "ACTIVE" : "INACTIVE")}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700"
                      onClick={() => {
                        setSuccessMessage(null);
                        form.reset({
                          name: "",
                          customerType: DEFAULT_CUSTOMER_TYPE,
                          cylinderType: cylinderTypes[0],
                          billType: billTypes[0],
                          securityDeposit: 0,
                          area: "",
                          city: "faisalabad",
                          country: "Pakistan",
                          address: "",
                          notes: "",
                          additionalContacts: createEmptyAdditionalContacts(),
                          status: "ACTIVE",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-[#1c5bff] px-8 text-sm font-semibold text-white shadow-md shadow-[#1c5bff]/20 hover:bg-[#1647c4]"
                  >
                    {isPending ? "Saving..." : "Save Customer"}
                  </Button>
                </div>
              </form>
            </Form>
            {successMessage && <p className="mt-4 text-sm text-emerald-600">{successMessage}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

