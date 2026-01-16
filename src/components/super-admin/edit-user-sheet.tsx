"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, UserStatus } from "@prisma/client";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  branch: z.string().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  businessName: string | null;
  branch: string | null;
}

interface EditUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function EditUserSheet({ open, onOpenChange, user, onSuccess }: EditUserSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessName: "",
      branch: "",
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        businessName: user.businessName || "",
        branch: user.branch || "",
        role: user.role,
        status: user.status,
      });
    }
  }, [user, reset]);

  const role = watch("role");
  const status = watch("status");

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        const errorMessage = result.error || result.details || "Failed to update user";
        toast.error(errorMessage);
        setError(errorMessage);
        console.error("Error updating user:", result);
        return;
      }

      toast.warning("User updated successfully.");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      const errorMsg = err?.message || "An unexpected error occurred. Please check the console for details.";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-4xl border-l border-[#e5eaf4] bg-white px-0 overflow-y-auto">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-8 py-6">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-2xl font-semibold text-slate-900">Edit User</SheetTitle>
              <p className="text-sm text-slate-500">Update user information below</p>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-900">
                  Full Name *
                </Label>
                <Input
                  id="edit-name"
                  {...register("name")}
                  placeholder="Enter full name"
                  className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-semibold text-slate-900">
                  Email *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-semibold text-slate-900">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  {...register("phone")}
                  placeholder="Enter phone number"
                  className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-businessName" className="text-sm font-semibold text-slate-900">
                  Business Name
                </Label>
                <Input
                  id="edit-businessName"
                  {...register("businessName")}
                  placeholder="Enter business name"
                  className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-branch" className="text-sm font-semibold text-slate-900">
                  Branch
                </Label>
                <Input
                  id="edit-branch"
                  {...register("branch")}
                  placeholder="Enter branch name"
                  className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm font-semibold text-slate-900">
                  Role *
                </Label>
                <Select
                  value={role}
                  onValueChange={(value) => setValue("role", value as UserRole)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                    <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
                    <SelectItem value={UserRole.BRANCH_MANAGER}>Branch Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-semibold text-slate-900">
                  Status *
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue("status", value as UserStatus)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white text-sm text-slate-900 focus:border-[#1c5bff] focus:ring-[#1c5bff]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    className="h-12 px-6 rounded-xl"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20 disabled:opacity-60"
                >
                  {isLoading ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
