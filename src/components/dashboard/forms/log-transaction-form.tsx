"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-retry";
import { log } from "@/lib/logger";

const UNASSIGNED_VALUE = "UNASSIGNED";

const formSchema = z.object({
  cylinderId: z.string().min(1, "Select a cylinder."),
  customerId: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  quantity: z.string().min(1, "Quantity is required."),
  recordedAt: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LogTransactionFormProps {
  cylinders: Array<{ id: string; serialNumber: string }>;
  customers: Array<{ id: string; name: string }>;
}

export function LogTransactionForm({ cylinders, customers }: LogTransactionFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cylinderId: "",
      customerId: UNASSIGNED_VALUE,
      type: TransactionType.ISSUE,
      quantity: "1",
      recordedAt: "",
      dueDate: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    setMessage(null);

    try {
      const response = await apiFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cylinderId: values.cylinderId,
          customerId:
            values.customerId && values.customerId !== UNASSIGNED_VALUE ? values.customerId : null,
          type: values.type,
          quantity: Number(values.quantity),
          recordedAt: values.recordedAt ? new Date(values.recordedAt).toISOString() : null,
          dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
          notes: values.notes,
        }),
      });

      if (!response.ok) {
        const errorMsg = "Failed to log transaction";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.info("Transaction logged successfully", { type: values.type, quantity: values.quantity });
      toast.success("Transaction logged successfully.");
      setStatus("success");
      setMessage("Transaction logged successfully.");
      form.reset({
        cylinderId: "",
        customerId: UNASSIGNED_VALUE,
        type: TransactionType.ISSUE,
        quantity: "1",
        recordedAt: "",
        dueDate: "",
        notes: "",
      });
    } catch (error) {
      log.error("Failed to log transaction", error, { type: values.type });
      const errorMsg = error instanceof Error ? error.message : "Unable to log transaction. Try again.";
      toast.error(errorMsg);
      setStatus("error");
      setMessage(errorMsg);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Log Movement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cylinderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cylinder</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cylinder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cylinders.map((cylinder) => (
                        <SelectItem key={cylinder.id} value={cylinder.id}>
                          {cylinder.serialNumber}
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
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === UNASSIGNED_VALUE ? undefined : value)
                    }
                    value={field.value ?? UNASSIGNED_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Warehouse</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TransactionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="recordedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorded At</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional operational notes" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              {message ? (
                <p
                  className={status === "success" ? "text-sm text-emerald-600" : "text-sm text-rose-600"}
                >
                  {message}
                </p>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Movements sync to analytics after submission.
                </span>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Log movement"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

