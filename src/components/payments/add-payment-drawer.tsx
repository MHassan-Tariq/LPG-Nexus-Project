"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatNumber, parseFormattedNumber } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithInput } from "@/components/ui/date-picker";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online Payment" },
  { value: "other", label: "Other" },
];

const paymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .int("Amount must be a whole number"),
  paidOn: z.date({
    required_error: "Payment date is required",
  }),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface AddPaymentDrawerProps {
  billId: string;
  billTotal: number;
  billPaid: number;
  billRemaining: number;
  customerName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddPaymentDrawer({
  billId,
  billTotal,
  billPaid,
  billRemaining,
  customerName,
  onSuccess,
  trigger,
}: AddPaymentDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined,
      paidOn: new Date(),
      method: "bank_transfer",
      notes: "",
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    setError(null);
    
    // Validate amount doesn't exceed remaining
    if (values.amount > billRemaining) {
      const errorMsg = `Payment amount (${currency.format(values.amount)}) cannot exceed remaining amount (${currency.format(billRemaining)}).`;
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billId,
            amount: values.amount,
            paidOn: values.paidOn.toISOString(),
            method: values.method,
            notes: values.notes || null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMsg = result.error || "Failed to record payment";
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }

        if (result.success) {
          toast.success("Payment recorded successfully.");
          form.reset({
            amount: undefined,
            paidOn: new Date(),
            method: "bank_transfer",
            notes: "",
          });
          setOpen(false);
          setError(null);
          onSuccess?.();
          router.refresh();
        } else {
          const errorMsg = result.error || "Failed to record payment";
          toast.error(errorMsg);
          setError(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to record payment";
        toast.error(errorMsg);
        console.error("Error recording payment:", err);
        setError(err instanceof Error ? err.message : "Failed to record payment");
      }
    });
  }

  const defaultTrigger = (
    <Button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#5b55eb] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#443ecd]"
    >
      <Plus className="h-4 w-4" />
      Add Payment
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Payment</SheetTitle>
          <SheetDescription>
            Record a payment for {customerName}. Remaining amount: {currency.format(billRemaining)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Bill Summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Amount:</span>
              <span className="font-semibold text-slate-900">{currency.format(billTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Already Paid:</span>
              <span className="font-semibold text-emerald-600">{currency.format(billPaid)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-600">Remaining:</span>
              <span className="font-semibold text-rose-600">{currency.format(billRemaining)}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter amount"
                        className="h-12"
                        value={field.value ? formatNumber(field.value) : ""}
                        onChange={(e) => {
                          const numValue = parseFormattedNumber(e.target.value);
                          field.onChange(numValue > 0 ? numValue : undefined);
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
                name="paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <DatePickerWithInput
                        date={field.value}
                        onChange={field.onChange}
                        placeholder="Select payment date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional notes about this payment"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-12"
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-[#5b55eb] hover:bg-[#443ecd]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
