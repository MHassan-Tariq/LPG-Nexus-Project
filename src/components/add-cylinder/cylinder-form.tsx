"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { cn, getTodayDate, formatNumber, parseFormattedNumber } from "@/lib/utils";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const billCreators = ["Mian Tariq SB", "Asraf SB", "Arif SB"];
const deliverers = ["Imran", "Khalil", "Amir"];
const cylinderLabels = [
  "12kg (Domestic cylinder)",
  "35kg (Business cylinder)",
  "45kg commercial cylinder (Simple)",
  "45kg commercial cylinder (LOT)",
];

export type CylinderCustomerOption = {
  id: string;
  customerCode: number;
  name: string;
};

const formSchema = z.object({
  billCreatedBy: z.string().min(1, "Select who created the bill."),
  cylinderType: z.enum(["DELIVERED", "RECEIVED"]),
  cylinderLabel: z.string().min(2, "Select a cylinder type."),
  deliveredBy: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Enter cylinder amount").optional(),
  unitPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  amount: z.coerce.number().min(0).optional(),
  customerName: z.string().min(2, "Select a customer from the list."),
  verified: z.boolean(),
  description: z.string().max(200).optional(),
  deliveryDate: z.coerce.date({ errorMap: () => ({ message: "Select delivery date" }) }),
  // RECEIVED type fields
  paymentType: z.enum(["CASH", "CREDIT"]).optional(),
  paymentAmount: z.coerce.number().min(0).optional(),
  paymentReceivedBy: z.string().optional(),
  emptyCylinderReceived: z.coerce.number().int().min(0).optional(),
}).refine((data) => {
  // For DELIVERED type, quantity, unitPrice, and deliveredBy are required
  if (data.cylinderType === "DELIVERED") {
    const hasValidQuantity = data.quantity !== undefined && data.quantity > 0;
    const hasValidUnitPrice = data.unitPrice !== undefined && data.unitPrice > 0;
    const hasValidDeliveredBy = data.deliveredBy !== undefined && data.deliveredBy.length > 0;
    
    if (!hasValidQuantity || !hasValidUnitPrice || !hasValidDeliveredBy) {
      return false;
    }
    return true;
  }
  return true;
}, {
  message: "Quantity, unit price, and delivered by are required for delivered cylinders.",
  path: ["quantity"],
}).refine((data) => {
  // For DELIVERED type, unitPrice must be positive
  if (data.cylinderType === "DELIVERED") {
    if (data.unitPrice === undefined || data.unitPrice <= 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Enter one cylinder price",
  path: ["unitPrice"],
}).refine((data) => {
  // For RECEIVED type, emptyCylinderReceived is required (must be > 0)
  if (data.cylinderType === "RECEIVED") {
    return data.emptyCylinderReceived !== undefined && data.emptyCylinderReceived > 0;
  }
  return true;
}, {
  message: "Empty cylinder received is required and must be greater than 0.",
  path: ["emptyCylinderReceived"],
});

export type CylinderFormValues = z.infer<typeof formSchema>;

interface CylinderFormProps {
  onSubmit: (values: CylinderFormValues) => Promise<void>;
  customers: CylinderCustomerOption[];
  initialValues?: Partial<CylinderFormValues>;
  onCancel?: () => void;
  onCustomerSelect?: (customerName: string) => void;
  disabled?: boolean;
}

const formatCustomerLabel = (customer: CylinderCustomerOption) =>
  `${customer.customerCode} · ${customer.name}`;

// Component for Cylinder Total input with zero removal on focus
function CylinderTotalInput({ field }: { field: any }) {
  const [displayValue, setDisplayValue] = useState<string>(
    field.value && field.value > 0 ? new Intl.NumberFormat('en-US').format(field.value) : "0"
  );

  useEffect(() => {
    if (field.value && field.value > 0) {
      setDisplayValue(new Intl.NumberFormat('en-US').format(field.value));
    } else {
      setDisplayValue("0");
    }
  }, [field.value]);

  return (
    <Input
      type="text"
      readOnly
      className="h-12 rounded-[18px] border-[#dde3f0] bg-slate-100 text-sm text-slate-700"
      value={displayValue}
      onFocus={() => {
        if (displayValue === "0") {
          setDisplayValue("");
        }
      }}
      onBlur={() => {
        if (!field.value || field.value === 0) {
          setDisplayValue("0");
        } else {
          setDisplayValue(new Intl.NumberFormat('en-US').format(field.value));
        }
      }}
    />
  );
}

export function CylinderForm({ onSubmit, customers, initialValues, onCancel, onCustomerSelect, disabled = false }: CylinderFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CylinderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billCreatedBy: initialValues?.billCreatedBy ?? billCreators[0],
      cylinderType: initialValues?.cylinderType ?? "DELIVERED",
      cylinderLabel: initialValues?.cylinderLabel ?? "",
      deliveredBy: initialValues?.deliveredBy ?? deliverers[0],
      quantity: initialValues?.quantity,
      unitPrice: initialValues?.unitPrice,
      amount: initialValues?.amount,
      customerName: initialValues?.customerName ?? "",
      verified: initialValues?.verified ?? false,
      description: initialValues?.description ?? "",
      deliveryDate: initialValues?.deliveryDate ?? getTodayDate(),
      emptyCylinderReceived: initialValues?.cylinderType === "RECEIVED" 
        ? (initialValues?.emptyCylinderReceived !== null && initialValues?.emptyCylinderReceived !== undefined
            ? initialValues.emptyCylinderReceived 
            : (initialValues?.quantity && initialValues.quantity > 0 ? initialValues.quantity : 1))
        : undefined,
    },
  });

  const quantityValue = form.watch("quantity");
  const unitPriceValue = form.watch("unitPrice");
  const cylinderType = form.watch("cylinderType");

  // Track the entry ID to detect when we're editing a different entry
  const editingEntryIdRef = useRef<string | null>(null);
  
  // Reset form when initialValues are provided (for edit mode)
  useEffect(() => {
    if (initialValues) {
      // Extract a unique identifier from initialValues
      // Use _entryId if available (more reliable), otherwise use composite key
      const currentEntryId = (initialValues as any)?._entryId 
        ? (initialValues as any)._entryId 
        : `${initialValues.customerName}-${initialValues.deliveryDate?.toISOString()}-${initialValues.cylinderType}`;
      const isNewEntry = editingEntryIdRef.current !== currentEntryId;
      
      // Only reset if this is a new entry being edited
      if (isNewEntry) {
        const resetValues = {
          billCreatedBy: initialValues.billCreatedBy ?? billCreators[0],
          cylinderType: initialValues.cylinderType ?? "DELIVERED",
          cylinderLabel: initialValues.cylinderLabel ?? "",
          deliveredBy: initialValues.deliveredBy ?? (initialValues.cylinderType === "DELIVERED" ? deliverers[0] : undefined),
          quantity: initialValues.quantity,
          unitPrice: initialValues.unitPrice,
          amount: initialValues.amount ?? 0,
          customerName: initialValues.customerName ?? "",
          verified: initialValues.verified ?? false,
          description: initialValues.description ?? "",
          deliveryDate: initialValues.deliveryDate ?? getTodayDate(),
          emptyCylinderReceived: initialValues.cylinderType === "RECEIVED"
            ? (initialValues.emptyCylinderReceived !== null && initialValues.emptyCylinderReceived !== undefined
                ? initialValues.emptyCylinderReceived
                : (initialValues.quantity && initialValues.quantity > 0 ? initialValues.quantity : 1))
            : undefined,
        };
        form.reset(resetValues);
        setCustomerInputValue(initialValues.customerName ?? "");
        setUseCustomCreator(initialValues.billCreatedBy ? !billCreators.includes(initialValues.billCreatedBy) : false);
        setUseCustomDeliverer(initialValues.deliveredBy ? !deliverers.includes(initialValues.deliveredBy) : false);
        editingEntryIdRef.current = currentEntryId;
        
        // Automatically filter table by customer when entering edit mode
        if (initialValues.customerName && onCustomerSelect) {
          // Pass the full customer name format (e.g., "4 · Arham") to filter the table
          onCustomerSelect(initialValues.customerName);
        }
      }
      // If it's the same entry (after update), don't reset - keep form values as they are
    } else {
      editingEntryIdRef.current = null;
    }
  }, [initialValues, form, onCustomerSelect]);

  useEffect(() => {
    // Only calculate amount for DELIVERED type
    if (cylinderType === "DELIVERED") {
      const total = Math.max(0, (quantityValue ?? 0) * (unitPriceValue ?? 0));
      form.setValue("amount", total, { shouldValidate: true });
    }
  }, [quantityValue, unitPriceValue, cylinderType, form]);

  async function handleSubmit(values: CylinderFormValues) {
    console.log("Form submitted with values:", values);
    console.log("Is edit mode:", !!initialValues);
    
    try {
      console.log("Calling onSubmit with values:", values);
      await onSubmit(values);
      console.log("onSubmit completed successfully");
      
      // Only reset to defaults if not editing (no initialValues)
      if (!initialValues) {
        // Preserve the cylinder type (DELIVERED or RECEIVED) after submission
        const preservedCylinderType = values.cylinderType;
        form.reset({
          billCreatedBy: values.billCreatedBy,
          cylinderType: preservedCylinderType,
          cylinderLabel: "",
          deliveredBy: preservedCylinderType === "DELIVERED" ? deliverers[0] : undefined,
          quantity: preservedCylinderType === "DELIVERED" ? 1 : undefined,
          unitPrice: preservedCylinderType === "DELIVERED" ? 0 : undefined,
          amount: 0,
          customerName: "",
          verified: false,
          description: "",
          deliveryDate: getTodayDate(),
          emptyCylinderReceived: preservedCylinderType === "RECEIVED" ? undefined : undefined,
        });
        setCustomerInputValue("");
        setUseCustomCreator(false);
        setUseCustomDeliverer(false);
        } else {
          // In edit mode, clear the form after successful update
          const preservedCylinderType = values.cylinderType;
      form.reset({
        billCreatedBy: values.billCreatedBy,
            cylinderType: preservedCylinderType,
        cylinderLabel: "",
            deliveredBy: preservedCylinderType === "DELIVERED" ? deliverers[0] : undefined,
            quantity: preservedCylinderType === "DELIVERED" ? 1 : undefined,
            unitPrice: preservedCylinderType === "DELIVERED" ? 0 : undefined,
        amount: 0,
        customerName: "",
        verified: false,
        description: "",
        deliveryDate: new Date(),
            paymentType: undefined,
            paymentAmount: preservedCylinderType === "RECEIVED" ? 0 : undefined,
            paymentReceivedBy: preservedCylinderType === "RECEIVED" ? "" : undefined,
            emptyCylinderReceived: preservedCylinderType === "RECEIVED" ? undefined : undefined,
      });
          setCustomerInputValue("");
          setUseCustomCreator(false);
          setUseCustomDeliverer(false);
        }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Error toast is handled in the wrapper component
      // Don't re-throw - let React Hook Form handle it
    }
  }
  
  // Debug function to check form state
  const handleFormError = (errors: any) => {
    console.log("Form validation errors:", errors);
    // Show validation errors to user
    const errorMessages: string[] = [];
    
    // Check all possible validation errors
    Object.keys(errors).forEach((field) => {
      const error = errors[field];
      if (error?.message) {
        errorMessages.push(`${field}: ${error.message}`);
      } else if (error?.root) {
        errorMessages.push(error.root.message || `Validation failed for ${field}`);
      }
    });
    
    if (errors.root) {
      errorMessages.push(errors.root.message || "Validation failed. Please check all required fields.");
    }
    
    if (errors.emptyCylinderReceived) {
      errorMessages.push(errors.emptyCylinderReceived.message || "Empty cylinder received is required");
    }
    if (errors.quantity) {
      errorMessages.push(errors.quantity.message || "Quantity is required");
    }
    if (errors.cylinderType) {
      errorMessages.push(errors.cylinderType.message || "Validation failed");
    }
    if (errors.billCreatedBy) {
      errorMessages.push(errors.billCreatedBy.message || "Bill created by is required");
    }
    if (errors.cylinderLabel) {
      errorMessages.push(errors.cylinderLabel.message || "Cylinder type is required");
    }
    if (errors.customerName) {
      errorMessages.push(errors.customerName.message || "Customer is required");
    }
    if (errors.deliveryDate) {
      errorMessages.push(errors.deliveryDate.message || "Delivery date is required");
    }
    
    const finalMessage = errorMessages.length > 0 
      ? errorMessages.join("\n") 
      : "Please check all required fields and try again.";
    
    // Show validation error toast
    toast.error(finalMessage);
  };

  const [useCustomCreator, setUseCustomCreator] = useState(
    initialValues?.billCreatedBy ? !billCreators.includes(initialValues.billCreatedBy) : false
  );
  const [useCustomDeliverer, setUseCustomDeliverer] = useState(
    initialValues?.deliveredBy ? !deliverers.includes(initialValues.deliveredBy) : false
  );
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [customerInputValue, setCustomerInputValue] = useState(initialValues?.customerName ?? "");
  
  const [billCreatorPopoverOpen, setBillCreatorPopoverOpen] = useState(false);
  
  const [cylinderTypePopoverOpen, setCylinderTypePopoverOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    // Get the selected customer from form
    const selectedCustomer = form.watch("customerName");
    
    // If input value matches selected customer or input is empty but customer is selected,
    // use empty query to show all customers
    // Otherwise use the input value as search query
    const isShowingSelected = customerInputValue === selectedCustomer || 
                              (!customerInputValue && selectedCustomer);
    const searchQuery = isShowingSelected 
      ? "" 
      : customerInputValue.trim().toLowerCase();
    
    let filtered = customers;
    
    if (searchQuery) {
      filtered = customers.filter((customer) => {
        const normalized = searchQuery.replace("#", "");
        const codeMatch = normalized ? String(customer.customerCode).includes(normalized) : false;
        const nameMatch = customer.name.toLowerCase().includes(searchQuery);
      return codeMatch || nameMatch;
    });
    }
    
    // Remove duplicates by customerCode (in case of any data issues)
    const uniqueCustomers = Array.from(
      new Map(filtered.map((customer) => [customer.customerCode, customer])).values()
    );
    
    // Always sort by customerCode to ensure consistent ordering
    return uniqueCustomers.sort((a, b) => a.customerCode - b.customerCode);
  }, [customerInputValue, customers, form]);

  const handleCustomerSelect = (customer: CylinderCustomerOption, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const label = formatCustomerLabel(customer);
    form.setValue("customerName", label, { shouldValidate: true });
    setCustomerInputValue(label);
    // Close popover immediately after selection - use setTimeout to ensure it happens after event processing
    setTimeout(() => {
    setCustomerPopoverOpen(false);
    }, 0);
    // Always notify parent to filter table by this customer (both in create and edit mode)
    // Pass the full customer label format (e.g., "1 · Arham") to ensure proper filtering
    if (onCustomerSelect) {
      onCustomerSelect(label);
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    // Always respect the open state - if closing, close it
    setCustomerPopoverOpen(open);
    
    // Only do additional logic when opening
    if (open) {
      // When opening with a selected customer, keep showing the selected customer name
      // The filtering logic will handle showing all customers in the dropdown
      const selectedCustomer = form.watch("customerName");
      
      // If no customer is selected and there's a search with no matches, clear it
      if (!selectedCustomer && customerInputValue.trim()) {
        const query = customerInputValue.trim().toLowerCase();
        const hasMatches = customers.some((customer) => {
          const normalized = query.replace("#", "");
          const codeMatch = normalized ? String(customer.customerCode).includes(normalized) : false;
          const nameMatch = customer.name.toLowerCase().includes(query);
          return codeMatch || nameMatch;
        });
        // Clear if no matches to show all customers
        if (!hasMatches) {
          setCustomerInputValue("");
        }
      }
      // If customer is selected but input doesn't match, set it to show selected customer
      else if (selectedCustomer && customerInputValue !== selectedCustomer) {
        setCustomerInputValue(selectedCustomer);
      }
    }
  };

  const handleBillCreatorPopoverOpenChange = (open: boolean) => {
    // Always allow normal open/close behavior
    setBillCreatorPopoverOpen(open);
  };

  const handleBillCreatorSelect = (creator: string) => {
    if (creator === "__custom") {
      setUseCustomCreator(true);
      form.setValue("billCreatedBy", "", { shouldValidate: true });
    } else {
      setUseCustomCreator(false);
      form.setValue("billCreatedBy", creator, { shouldValidate: true });
    }
    setBillCreatorPopoverOpen(false);
  };

  const handleCylinderTypePopoverOpenChange = (open: boolean) => {
    // Allow normal open/close behavior for cylinder type
    setCylinderTypePopoverOpen(open);
  };

  const handleCylinderTypeSelect = (label: string) => {
    form.setValue("cylinderLabel", label, { shouldValidate: true });
    // Close the popover immediately when selecting
    setCylinderTypePopoverOpen(false);
  };

  return (
    <Card className="rounded-[32px] border border-[#e5eaf4] bg-white shadow-none">
      <CardContent className="p-4 space-y-5 lg:p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{initialValues ? "Edit Cylinder" : "Add/Received Cylinder"}</h2>
          <p className="text-sm text-slate-500">Enter the delivery or receiving details.</p>
        </div>
        <Form {...form}>
          <fieldset disabled={disabled} className="space-y-6">
          <form 
            onSubmit={form.handleSubmit(
              (values) => {
                if (disabled) return;
                startTransition(async () => {
                  await handleSubmit(values);
                });
              },
              handleFormError
            )} 
            className="space-y-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="cylinderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <div className="flex h-14 rounded-[18px] border border-[#dde3f0] bg-slate-50 p-1">
                        {(["DELIVERED", "RECEIVED"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={cn(
                              "flex-1 rounded-[14px] text-sm transition border border-transparent",
                              field.value === value
                                ? "bg-white text-[#2544d6] border-[#cdd6f8]"
                                : "text-slate-500 hover:text-slate-700",
                            )}
                          >
                            {value === "DELIVERED" ? "Delivered" : "Received"}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer ID / name</FormLabel>
                    <FormControl>
                      <Popover 
                        open={customerPopoverOpen} 
                        onOpenChange={handlePopoverOpenChange}
                        modal={false}
                      >
                        <PopoverTrigger asChild>
                          <Input
                            placeholder="Search by customer ID or name"
                            className={cn(
                              "h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700 cursor-pointer",
                              !field.value && !customerInputValue && "text-slate-500",
                            )}
                            value={customerInputValue || field.value || ""}
                            onFocus={() => {
                              if (!customerPopoverOpen) {
                                const selectedCustomer = field.value;
                                
                                // If customer is selected, ensure input shows the selected customer
                                if (selectedCustomer && customerInputValue !== selectedCustomer) {
                                  setCustomerInputValue(selectedCustomer);
                                } else if (!selectedCustomer && customerInputValue.trim()) {
                                  // No customer selected - check if search has matches
                                  const query = customerInputValue.trim().toLowerCase();
                                  const hasMatches = customers.some((customer) => {
                                    const normalized = query.replace("#", "");
                                    const codeMatch = normalized ? String(customer.customerCode).includes(normalized) : false;
                                    const nameMatch = customer.name.toLowerCase().includes(query);
                                    return codeMatch || nameMatch;
                                  });
                                  // Clear if no matches
                                  if (!hasMatches) {
                                    setCustomerInputValue("");
                                  }
                                }
                              }
                              setCustomerPopoverOpen(true);
                            }}
                            onPointerDown={(e) => {
                              // Prevent the PopoverTrigger's default toggle behavior
                              if (!customerPopoverOpen) {
                                e.preventDefault();
                              }
                            }}
                            onClick={(e) => {
                              if (!customerPopoverOpen) {
                                const selectedCustomer = field.value;
                                
                                // If customer is selected, ensure input shows the selected customer
                                if (selectedCustomer && customerInputValue !== selectedCustomer) {
                                  setCustomerInputValue(selectedCustomer);
                                } else if (!selectedCustomer && customerInputValue.trim()) {
                                  // No customer selected - check if search has matches
                                  const query = customerInputValue.trim().toLowerCase();
                                  const hasMatches = customers.some((customer) => {
                                    const normalized = query.replace("#", "");
                                    const codeMatch = normalized ? String(customer.customerCode).includes(normalized) : false;
                                    const nameMatch = customer.name.toLowerCase().includes(query);
                                    return codeMatch || nameMatch;
                                  });
                                  // Clear if no matches
                                  if (!hasMatches) {
                                    setCustomerInputValue("");
                                  }
                                }
                              }
                              // Always open popover when clicking, even if value exists
                              setCustomerPopoverOpen(true);
                              // Allow the input to receive focus
                              e.currentTarget.focus();
                            }}
                            onChange={(event) => {
                              const newValue = event.target.value;
                              setCustomerInputValue(newValue);
                              // If user is typing something different from selected customer, clear the selection
                              const selectedCustomer = field.value;
                              if (selectedCustomer && newValue !== selectedCustomer) {
                                form.setValue("customerName", "", { shouldValidate: false });
                              }
                              setCustomerPopoverOpen(true);
                            }}
                            disabled={customers.length === 0}
                          />
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[320px] max-w-sm rounded-2xl border border-slate-100 bg-white p-3 shadow-lg" 
                          align="start"
                        >
                          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                            {filteredCustomers.length === 0 ? (
                              <p className="px-2 py-6 text-center text-sm text-slate-500">
                                {customers.length === 0 
                                  ? "No customers available. Add a customer first."
                                  : "No customers match your search."}
                              </p>
                            ) : (
                              filteredCustomers.map((customer) => {
                                const label = formatCustomerLabel(customer);
                                const isSelected = field.value === label;
                                return (
                                  <button
                                    type="button"
                                    key={customer.id}
                                    onClick={(e) => handleCustomerSelect(customer, e)}
                                    className={cn(
                                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                                      isSelected
                                        ? "border-[#cdd6f8] bg-[#f5f7ff] text-[#2544d6]"
                                        : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                                    )}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold text-slate-900">
                                        {customer.customerCode}
                                      </span>
                                      <span className="text-sm text-slate-500">{customer.name}</span>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-[#2544d6]" strokeWidth={2.5} />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billCreatedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{cylinderType === "RECEIVED" ? "Cylinder received by" : "Bill created by"}</FormLabel>
                    <FormControl>
                      <>
                        <Popover open={billCreatorPopoverOpen} onOpenChange={handleBillCreatorPopoverOpenChange}>
                          <PopoverTrigger asChild>
                            <Input
                              placeholder="Select creator"
                              className={cn(
                                "h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700",
                                !useCustomCreator && "cursor-pointer",
                                !field.value && !useCustomCreator && "text-slate-500",
                              )}
                              value={field.value || ""}
                              readOnly={!useCustomCreator}
                              onFocus={() => {
                                if (!billCreatorPopoverOpen && !useCustomCreator) {
                                  setBillCreatorPopoverOpen(true);
                                }
                              }}
                              onPointerDown={(e) => {
                                if (!billCreatorPopoverOpen && !useCustomCreator) {
                                  e.preventDefault();
                                }
                              }}
                              onClick={(e) => {
                                if (!useCustomCreator) {
                                  setBillCreatorPopoverOpen(true);
                                  e.currentTarget.focus();
                                }
                              }}
                              onChange={(event) => {
                                if (useCustomCreator) {
                                  field.onChange(event.target.value);
                                }
                              }}
                            />
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[320px] max-w-sm rounded-2xl border border-slate-100 bg-white p-3 shadow-lg" 
                            align="start"
                          >
                            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                              {billCreators.map((name) => {
                                const isSelected = field.value === name;
                                return (
                                  <button
                                    type="button"
                                    key={name}
                                    onClick={() => handleBillCreatorSelect(name)}
                                    className={cn(
                                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                                      isSelected
                                        ? "border-[#cdd6f8] bg-[#f5f7ff] text-[#2544d6]"
                                        : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                                    )}
                                  >
                                    <span className="text-sm font-medium">{name}</span>
                                    {isSelected && <Check className="h-4 w-4 text-[#2544d6]" strokeWidth={2.5} />}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => handleBillCreatorSelect("__custom")}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                                  useCustomCreator
                                    ? "border-[#cdd6f8] bg-[#f5f7ff] text-[#2544d6]"
                                    : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                                )}
                              >
                                <span className="text-sm font-medium">Custom…</span>
                                {useCustomCreator && <Check className="h-4 w-4 text-[#2544d6]" strokeWidth={2.5} />}
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        {useCustomCreator && (
                          <Input
                            autoFocus
                            value={field.value}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                            }}
                            placeholder="Enter custom creator"
                            className="mt-3 h-11 rounded-[16px] border-[#dde3f0] bg-white text-sm text-slate-700"
                          />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cylinderLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cylinder type</FormLabel>
                    <FormControl>
                      <Popover open={cylinderTypePopoverOpen} onOpenChange={handleCylinderTypePopoverOpenChange}>
                        <PopoverTrigger asChild>
                          <Input
                            placeholder="Choose cylinder type"
                            className={cn(
                              "h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700 cursor-pointer",
                              !field.value && "text-slate-500",
                            )}
                            value={field.value || ""}
                            readOnly
                            onFocus={() => {
                              if (!cylinderTypePopoverOpen) {
                                setCylinderTypePopoverOpen(true);
                              }
                            }}
                            onPointerDown={(e) => {
                              if (!cylinderTypePopoverOpen) {
                                e.preventDefault();
                              }
                            }}
                            onClick={(e) => {
                              setCylinderTypePopoverOpen(true);
                              e.currentTarget.focus();
                            }}
                          />
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-[320px] max-w-sm rounded-2xl border border-slate-100 bg-white p-3 shadow-lg" 
                          align="start"
                        >
                          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                            {cylinderLabels.map((label) => {
                              const isSelected = field.value === label;
                              return (
                                <button
                                  type="button"
                                  key={label}
                                  onClick={() => handleCylinderTypeSelect(label)}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                                    isSelected
                                      ? "border-[#cdd6f8] bg-[#f5f7ff] text-[#2544d6]"
                                      : "border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50",
                                  )}
                                >
                                  <span className="text-sm font-medium">{label}</span>
                                  {isSelected && <Check className="h-4 w-4 text-[#2544d6]" strokeWidth={2.5} />}
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* DELIVERED type fields */}
              {cylinderType === "DELIVERED" && (
                <>
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cylinder quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter cylinder quantity"
                            className="h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700"
                            value={field.value !== null && field.value !== undefined ? formatNumber(field.value) : ""}
                            onChange={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              if (numValue === 0) {
                                field.onChange(undefined);
                              } else {
                                field.onChange(numValue);
                              }
                            }}
                            onBlur={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              if (numValue > 0) {
                                field.onChange(numValue);
                                e.target.value = formatNumber(numValue);
                              } else {
                                field.onChange(undefined);
                                e.target.value = "";
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One cylinder price</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter price per cylinder"
                            className="h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700"
                            value={field.value !== null && field.value !== undefined ? formatNumber(field.value) : ""}
                            onChange={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              if (numValue === 0) {
                                field.onChange(undefined);
                              } else {
                                field.onChange(numValue);
                              }
                            }}
                            onBlur={(e) => {
                              const numValue = parseFormattedNumber(e.target.value);
                              if (numValue > 0) {
                                field.onChange(numValue);
                                e.target.value = formatNumber(numValue);
                              } else {
                                field.onChange(undefined);
                                e.target.value = "";
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cylinder total</FormLabel>
                        <FormControl>
                          <CylinderTotalInput field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* RECEIVED type fields */}
              {cylinderType === "RECEIVED" && (
                <FormField
                  control={form.control}
                  name="emptyCylinderReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empty cylinder received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter empty cylinders received"
                          min={1}
                          step="1"
                          required
                          className="h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700"
                          {...field}
                          value={field.value !== null && field.value !== undefined ? field.value : ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : (Number(e.target.value) || undefined);
                            field.onChange(value);
                          }}
                          onBlur={(e) => {
                            // Ensure value is at least 1 when field loses focus
                            if (field.value === undefined || field.value < 1) {
                              field.onChange(1);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="deliveredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{cylinderType === "DELIVERED" ? "Delivered by" : "Get By"}</FormLabel>
                    <FormControl>
                      <>
                        <Select
                          value={useCustomDeliverer ? "__custom" : field.value}
                          onValueChange={(val) => {
                            if (val === "__custom") {
                              setUseCustomDeliverer(true);
                              field.onChange("");
                            } else {
                              setUseCustomDeliverer(false);
                              field.onChange(val);
                            }
                          }}
                        >
                        <SelectTrigger className="h-12 rounded-[18px] border-[#dde3f0] bg-slate-50 text-sm text-slate-700">
                            <SelectValue placeholder="Select person" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border border-slate-100 bg-white shadow-xl">
                            {deliverers.map((name) => (
                              <SelectItem key={name} value={name} className="text-sm font-medium text-slate-700">
                                {name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom" className="text-sm font-medium text-slate-700">
                              Custom…
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {useCustomDeliverer && (
                          <Input
                            autoFocus
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                            placeholder="Enter custom name"
                            className="mt-3 h-11 rounded-[16px] border-[#dde3f0] bg-white text-sm text-slate-700"
                          />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description field removed from DELIVERED form */}

            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-[18px] border border-[#dde3f0] bg-slate-50 px-4 py-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                  </FormControl>
                  <FormLabel className="m-0 text-sm">Verified by customer</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Delivery date</FormLabel>
                  <DatePickerWithInput
                    date={field.value}
                    onChange={field.onChange}
                    placeholder="Select delivery date"
                    className="w-full bg-slate-50"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  }
                  form.reset({
                    billCreatedBy: billCreators[0],
                    cylinderType: "DELIVERED",
                    cylinderLabel: "",
                    deliveredBy: deliverers[0],
                    quantity: 1,
                    unitPrice: 0,
                    amount: 0,
                    customerName: "",
                    verified: false,
                    description: "",
                    deliveryDate: getTodayDate(),
                    emptyCylinderReceived: undefined,
                  });
                  setCustomerInputValue("");
                  setUseCustomCreator(false);
                  setUseCustomDeliverer(false);
                }}
                className="h-12 rounded-[20px] border border-slate-200 text-sm font-semibold text-slate-600"
              >
                {initialValues ? "Cancel" : "Clear"}
              </Button>
              <Button
                type="submit"
                className="h-12 rounded-[20px] bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4]"
                disabled={isPending || disabled}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialValues 
                  ? "Update Cylinder" 
                  : cylinderType === "RECEIVED" 
                    ? "Received Cylinder" 
                    : "Add Cylinder"}
              </Button>
            </div>
          </form>
          </fieldset>
        </Form>
      </CardContent>
    </Card>
  );
}



