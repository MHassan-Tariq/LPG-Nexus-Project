"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { formatNumber, parseFormattedNumber } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

/**
 * Capitalizes the first letter of each word in a string
 * Lowercases the rest of each word and preserves original spacing
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
function capitalizeWords(str: string): string {
  if (!str) return str;
  // Split by word boundaries, capitalize first letter and lowercase the rest
  return str
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const cylinderTypes = ["12kg (Domestic cylinder)", "35kg (Business cylinder)", "45kg (Commercial cylinder)"];
const billTypes = ["Cash", "Credit"];

const formSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters").max(80),
  contactNumber: z
    .string()
    .optional()
    .default("")
    .refine(
      (val) => !val || val === "" || (val.length === 11 && /^\d{11}$/.test(val)),
      "Pakistani phone number must be exactly 11 digits"
    ),
  customerType: z.string().min(2).max(48).default(DEFAULT_CUSTOMER_TYPE),
  cylinderType: z.string().min(2, "Select a cylinder type").max(64),
  billType: z.string().min(2, "Select a bill type").max(32),
  securityDeposit: z.coerce.number().int().min(0).default(0),
  area: z.string().min(2, "Area must be at least 2 characters").max(80),
  city: z.string().min(2, "City must be at least 2 characters").max(80),
  country: z.string().min(2, "Country must be at least 2 characters").max(80),
  address: z.string().min(5, "Address must be at least 5 characters").max(200),
  notes: z.string().max(200).optional().nullable(),
  additionalContacts: z
    .array(
      z.object({
        name: z.string().default(""),
        contactNumber: z.string().default(""),
      }),
    )
    .optional()
    .default(createEmptyAdditionalContacts()),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  nextCustomerCode: number;
  initialValues?: Partial<CustomerFormValues> & { customerCode?: number; id?: string };
  mode?: "add" | "edit";
  onCancel?: () => void;
}

export function CustomerFormDrawer({
  open,
  onOpenChange,
  onSubmit,
  nextCustomerCode,
  initialValues,
  mode = "add",
  onCancel,
}: CustomerFormDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditMode = mode === "edit" && initialValues;
  const customerCode = isEditMode && initialValues.customerCode ? initialValues.customerCode : nextCustomerCode;

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
      city: "Faisalabad",
      country: "Pakistan",
      address: "",
      notes: "",
      additionalContacts: createEmptyAdditionalContacts(),
      status: "ACTIVE",
      email: null,
    },
  });

  const contactsArray = useFieldArray({
    control: form.control,
    name: "additionalContacts",
  });

  // Clear messages when drawer opens
  useEffect(() => {
    if (open) {
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [open]);

  // Reset form when initialValues change (for edit mode)
  useEffect(() => {
    if (isEditMode && initialValues) {
      const existingContacts = initialValues.additionalContacts && initialValues.additionalContacts.length > 0
        ? initialValues.additionalContacts
        : [{ name: "", contactNumber: initialValues.contactNumber || "" }];

      form.reset({
        name: initialValues.name || "",
        contactNumber: initialValues.contactNumber || "",
        customerType: initialValues.customerType || DEFAULT_CUSTOMER_TYPE,
        cylinderType: initialValues.cylinderType || cylinderTypes[0],
        billType: initialValues.billType || "Credit",
        securityDeposit: initialValues.securityDeposit ?? 0,
        area: initialValues.area || "",
        city: initialValues.city || "faisalabad",
        country: initialValues.country || "Pakistan",
        address: initialValues.address || "",
        notes: initialValues.notes ?? "",
        additionalContacts: existingContacts,
        status: initialValues.status || "ACTIVE",
        email: initialValues.email ?? null,
      });
    } else if (!isEditMode && open) {
      // Reset to defaults when opening for add mode
      form.reset({
        name: "",
        contactNumber: "",
        customerType: DEFAULT_CUSTOMER_TYPE,
        cylinderType: cylinderTypes[0],
        billType: "Credit",
        securityDeposit: 0,
        area: "",
        city: "Faisalabad",
        country: "Pakistan",
        address: "",
        notes: "",
        additionalContacts: createEmptyAdditionalContacts(),
        status: "ACTIVE",
        email: null,
      });
    }
  }, [initialValues, isEditMode, open, form]);

  const contactsError = form.formState.errors.additionalContacts as { message?: string };

  const handleSubmit = async (values: CustomerFormValues) => {
    console.log("Form submitted with values:", values);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Check if additionalContacts is empty or invalid BEFORE other validation
    const sanitizedContacts =
      values.additionalContacts
        ?.map((contact, index) => {
          const name = (contact.name || "").trim();
          const contactNumber = (contact.contactNumber || "").trim();
          
          // Check if contact is partially filled (has one but not both fields)
          if ((name && !contactNumber) || (!name && contactNumber)) {
            form.setError(`additionalContacts.${index}.${name ? "contactNumber" : "name"}` as any, {
              type: "manual",
              message: "Both name and contact number are required",
            });
          }
          
          // Validate contact number format if provided
          if (contactNumber && !/^\d{11}$/.test(contactNumber)) {
            form.setError(`additionalContacts.${index}.contactNumber` as any, {
              type: "manual",
              message: "Pakistani phone number must be exactly 11 digits",
            });
            return null;
          }
          
          // Validate name length if provided
          if (name && name.length < 2) {
            form.setError(`additionalContacts.${index}.name` as any, {
              type: "manual",
              message: "Contact name must be at least 2 characters",
            });
            return null;
          }
          
          // Return valid contact
          if (name && contactNumber) {
            return { name, contactNumber };
          }
          return null;
        })
        .filter((contact): contact is { name: string; contactNumber: string } => contact !== null) ?? [];

    if (sanitizedContacts.length === 0) {
      form.setError("additionalContacts", {
        type: "manual",
        message: "Add at least one contact person with both name and contact number.",
      } as any);
      setErrorMessage("Please add at least one contact person with both name (min 2 characters) and contact number (11 digits). Click '+ Add Contact' to add a contact.");
      return;
    }
    
    // Validate form after checking contacts
    const validationResult = formSchema.safeParse(values);
    if (!validationResult.success) {
      console.error("Form validation failed:", validationResult.error);
      const errors = validationResult.error.flatten().fieldErrors;
      // Set form errors
      Object.keys(errors).forEach((key) => {
        const fieldErrors = errors[key as keyof typeof errors];
        if (fieldErrors && fieldErrors.length > 0) {
          form.setError(key as any, { message: fieldErrors[0] });
        }
      });
      const errorMessages = Object.values(errors).flat().filter(Boolean);
      setErrorMessage(`Please fix the following errors: ${errorMessages.join(", ")}`);
      return;
    }

    const payload: CustomerFormValues = {
      ...values,
      contactNumber: sanitizedContacts[0].contactNumber,
      additionalContacts: sanitizedContacts,
    };

    console.log("Submitting payload:", payload);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    startTransition(async () => {
      try {
        await onSubmit(payload);
        console.log("Customer saved successfully");
        if (isEditMode) {
          toast.warning("Customer updated successfully.");
        } else {
          toast.success("Customer saved successfully.");
        }
        setSuccessMessage(isEditMode ? "Customer updated successfully." : "Customer saved successfully.");
        
        if (!isEditMode) {
          form.reset({
            name: "",
            contactNumber: "",
            customerType: DEFAULT_CUSTOMER_TYPE,
            cylinderType: cylinderTypes[0],
            billType: "Credit",
            securityDeposit: 0,
            area: "",
            city: "Faisalabad",
            country: "Pakistan",
            address: "",
            notes: "",
            additionalContacts: createEmptyAdditionalContacts(),
            status: "ACTIVE",
            email: null,
          });
          // Delay closing to show success message
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        } else {
          // For edit mode, delay closing to show success message
          setTimeout(() => {
            onOpenChange(false);
            if (onCancel) {
              onCancel();
            }
          }, 1500);
        }
      } catch (error: any) {
        console.error("Error saving customer:", error);
        const errorMsg = error?.message || error?.toString() || "Failed to save customer. Please try again.";
        setErrorMessage(errorMsg);
      }
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
    setSuccessMessage(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-4xl border-l border-[#e5eaf4] bg-white px-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-8 py-6">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-2xl font-semibold text-slate-900">
                {isEditMode ? "Edit Customer" : "Add New Customer"}
              </SheetTitle>
              <p className="text-sm text-slate-500">
                {isEditMode ? "Update customer details below" : "Fill in the customer details below"}
              </p>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(
                  handleSubmit,
                  (errors) => {
                    // Handle React Hook Form validation errors
                    console.error("React Hook Form validation errors:", errors);
                    const errorMessages = Object.values(errors)
                      .map((error: any) => error?.message)
                      .filter(Boolean)
                      .flat();
                    if (errorMessages.length > 0) {
                      setErrorMessage(`Please fix the form errors: ${errorMessages.join(", ")}`);
                    }
                  }
                )} 
                className="space-y-6"
              >
                <section className={sectionCardClasses}>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Customer ID</p>
                    <p className="text-2xl font-semibold text-slate-900">#{customerCode}</p>
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
                              onChange={(e) => {
                                const capitalized = capitalizeWords(e.target.value);
                                field.onChange(capitalized);
                              }}
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
                  {contactsError?.message && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800 font-medium">{contactsError.message}</p>
                    </div>
                  )}
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
                                    onChange={(e) => {
                                      const capitalized = capitalizeWords(e.target.value);
                                      field.onChange(capitalized);
                                    }}
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
                                    maxLength={11}
                                    placeholder="03001234567"
                                    className="h-11 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                                    value={field.value ?? ""}
                                    onChange={(event) => {
                                      const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
                                      // Limit to 11 digits
                                      if (digitsOnly.length <= 11) {
                                        field.onChange(digitsOnly);
                                      }
                                    }}
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
                              type="text"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              value={field.value ? formatNumber(field.value) : ""}
                              onChange={(e) => {
                                const numValue = parseFormattedNumber(e.target.value);
                                field.onChange(numValue >= 0 ? numValue : 0);
                              }}
                              onBlur={(e) => {
                                const numValue = parseFormattedNumber(e.target.value);
                                field.onChange(numValue >= 0 ? numValue : 0);
                                if (numValue > 0) {
                                  e.target.value = formatNumber(numValue);
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
                              placeholder="D Ground"
                              className="h-12 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700"
                              {...field}
                              onChange={(e) => {
                                const capitalized = capitalizeWords(e.target.value);
                                field.onChange(capitalized);
                              }}
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
                              onChange={(e) => {
                                const capitalized = capitalizeWords(e.target.value);
                                field.onChange(capitalized);
                              }}
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
                            onChange={(e) => {
                              const capitalized = capitalizeWords(e.target.value);
                              field.onChange(capitalized);
                            }}
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
                            onChange={(e) => {
                              const capitalized = capitalizeWords(e.target.value);
                              field.onChange(capitalized);
                            }}
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
                            onChange={(e) => {
                              const capitalized = capitalizeWords(e.target.value);
                              field.onChange(capitalized);
                            }}
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

                {errorMessage && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700"
                    onClick={handleCancel}
                  >
                    {isEditMode ? "Cancel" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    loading={isPending}
                    className="rounded-xl bg-[#1c5bff] px-8 text-sm font-semibold text-white shadow-md shadow-[#1c5bff]/20 hover:bg-[#1647c4] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Customer" : "Save Customer")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

