"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CylinderStatus } from "@prisma/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UNASSIGNED_VALUE = "UNASSIGNED";

const formSchema = z.object({
  serialNumber: z.string().min(3, "Serial number is required."),
  gasType: z.string().min(1, "Gas type is required."),
  capacityLiters: z.string().min(1, "Capacity is required."),
  status: z.nativeEnum(CylinderStatus),
  location: z.string().min(2, "Location is required."),
  pressurePsi: z.string().optional(),
  lastInspection: z.string().optional(),
  nextInspection: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().max(160).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCylinderFormProps {
  customers: Array<{ id: string; name: string }>;
}

export function CreateCylinderForm({ customers }: CreateCylinderFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      gasType: "LPG",
      capacityLiters: "14",
      status: CylinderStatus.IN_STOCK,
      location: "",
      pressurePsi: "",
      lastInspection: "",
      nextInspection: "",
      customerId: UNASSIGNED_VALUE,
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    setMessage(null);
    try {
      const payload = {
        serialNumber: values.serialNumber,
        gasType: values.gasType,
        capacityLiters: Number(values.capacityLiters),
        status: values.status,
        location: values.location,
        pressurePsi: values.pressurePsi ? Number(values.pressurePsi) : null,
        lastInspection: values.lastInspection ? new Date(values.lastInspection).toISOString() : null,
        nextInspection: values.nextInspection ? new Date(values.nextInspection).toISOString() : null,
        customerId:
          values.customerId && values.customerId !== UNASSIGNED_VALUE ? values.customerId : null,
        notes: values.notes,
      };

      const response = await apiFetch("/api/cylinders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMsg = "Failed to create cylinder";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      log.info("Cylinder created successfully", { serialNumber: payload.serialNumber });
      toast.success("Cylinder registered successfully.");
      setStatus("success");
      setMessage("Cylinder registered successfully.");
      form.reset({
        serialNumber: "",
        gasType: "LPG",
        capacityLiters: "14",
        status: CylinderStatus.IN_STOCK,
        location: "",
        pressurePsi: "",
        lastInspection: "",
        nextInspection: "",
        customerId: UNASSIGNED_VALUE,
        notes: "",
      });
    } catch (error) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : "Unable to register cylinder. Please retry.";
      toast.error(errorMsg);
      setStatus("error");
      setMessage(errorMsg);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Register Cylinder</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="CYL-2045" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gasType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gas Type</FormLabel>
                    <FormControl>
                      <Input placeholder="LPG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="capacityLiters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (L)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} placeholder="Enter capacity (e.g. 14)" {...field} />
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(CylinderStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Warehouse A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Customer</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === UNASSIGNED_VALUE ? undefined : value)
                      }
                      value={field.value ?? UNASSIGNED_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="pressurePsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressure (psi)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastInspection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Inspection</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nextInspection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Inspection</FormLabel>
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
                    <Textarea placeholder="Operational notes (optional)" rows={3} {...field} />
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
                  All cylinders are version controlled for audit history.
                </span>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save cylinder"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

