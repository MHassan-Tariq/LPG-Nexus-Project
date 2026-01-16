"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { Upload, User as UserIcon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/app/profile/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.union([
    z.string().min(2, "Username must be at least 2 characters"),
    z.literal(""),
  ]).optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["Admin", "Manager", "Viewer"]),
  department: z.enum(["Operations", "Finance", "Distribution", "Customer Support"]).optional(),
  companyDescription: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    username?: string | null;
    department?: string | null;
    profileImage?: string | null;
    companyDescription?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    stateProvince?: string | null;
    country?: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(initialData.profileImage ?? null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      username: initialData.username ?? "",
      email: initialData.email,
      phone: initialData.phone ?? "",
      // Map database role enum to form role values
      role: (() => {
        const roleUpper = initialData.role.toUpperCase();
        if (roleUpper === "ADMIN") return "Admin";
        if (roleUpper === "STAFF" || roleUpper === "BRANCH_MANAGER") return "Manager";
        if (roleUpper === "VIEWER") return "Viewer";
        return "Admin"; // Default fallback
      })() as "Admin" | "Manager" | "Viewer",
      department: (initialData.department ?? "Operations") as
        | "Operations"
        | "Finance"
        | "Distribution"
        | "Customer Support",
      companyDescription: initialData.companyDescription ?? "",
      streetAddress: initialData.streetAddress ?? "",
      city: initialData.city ?? "fsd",
      stateProvince: initialData.stateProvince ?? "punjab",
      country: initialData.country ?? "pakistan",
    },
  });


  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setNotification({ message: "Please select a JPG, PNG, or GIF file", type: "error" });
        return;
      }

      // Validate file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setNotification({ message: "File size must be less than 2MB", type: "error" });
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function onProfileSubmit(data: ProfileFormValues) {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    try {
      // Convert image file to base64 if selected
      let imageDataUrl = profileImage;
      if (profileImageFile) {
        console.log("Converting image file to base64...");
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(profileImageFile);
        imageDataUrl = await base64Promise;
        console.log("Image converted, length:", imageDataUrl.length);
      }

      console.log("Calling updateProfile...");
      const result = await updateProfile({
        id: initialData.id,
        ...data,
        profileImage: imageDataUrl,
      });

      console.log("Update result:", result);

      // Check if the update was successful
      if (!result.success) {
        const errorMsg = result.error || "Failed to update profile";
        console.error("Update failed:", errorMsg);
        toast.error(errorMsg);
        setNotification({
          message: errorMsg,
          type: "error",
        });
        return;
      }

      console.log("Profile updated successfully");
      toast.success("Profile updated successfully.");
      setNotification({ message: "Profile updated successfully!", type: "success" });
      
      // Dispatch custom event to notify topbar of profile update
      window.dispatchEvent(new CustomEvent("profile-updated"));
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error in onProfileSubmit:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMsg);
      setNotification({
        message: errorMsg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  const initials = initialData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            "fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all",
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {notification.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Profile Management</h1>
          <p className="text-sm text-slate-500">Manage your account settings and profile information</p>
        </div>

        {/* Profile Picture Section */}
        <div className="mb-8 flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-slate-200">
            <AvatarImage 
              src={profileImage ?? undefined} 
              alt={initialData.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-slate-100 text-lg text-slate-600">
              {profileImage ? null : initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-fit gap-2 rounded-xl border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max size 2MB</p>
          </div>
        </div>

        {/* Profile Form */}
        <form 
          onSubmit={profileForm.handleSubmit(
            onProfileSubmit,
            (errors) => {
              console.error("Form validation errors:", errors);
              const firstError = Object.values(errors)[0];
              const errorMessage = firstError?.message || "Please fix the form errors";
              toast.error(errorMessage);
              setNotification({
                message: errorMessage,
                type: "error",
              });
            }
          )} 
          className="space-y-6"
        >
          {/* User Details - Two Columns */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                {...profileForm.register("name")}
                className="rounded-xl border-slate-300"
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Enter username"
                {...profileForm.register("username")}
                className="rounded-xl border-slate-300"
              />
              {profileForm.formState.errors.username && (
                <p className="text-xs text-red-600">{profileForm.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <Input
                id="email"
                placeholder="Enter email address"
                {...profileForm.register("email")}
                className="rounded-xl border-slate-300"
              />
              {profileForm.formState.errors.email && (
                <p className="text-xs text-red-600">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                {...profileForm.register("phone")}
                className="rounded-xl border-slate-300"
              />
              {profileForm.formState.errors.phone && (
                <p className="text-xs text-red-600">{profileForm.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-slate-700">
                Role
              </Label>
              <Select
                value={profileForm.watch("role")}
                onValueChange={(value) => profileForm.setValue("role", value as "Admin" | "Manager" | "Viewer")}
              >
                <SelectTrigger className="rounded-xl border-slate-300">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                Department
              </Label>
              <Select
                value={profileForm.watch("department")}
                onValueChange={(value) =>
                  profileForm.setValue(
                    "department",
                    value as "Operations" | "Finance" | "Distribution" | "Customer Support",
                  )
                }
              >
                <SelectTrigger className="rounded-xl border-slate-300">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Distribution">Distribution</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company Description */}
          <div className="space-y-2">
            <Label htmlFor="companyDescription" className="text-sm font-medium text-slate-700">
              Company Description
            </Label>
            <Textarea
              id="companyDescription"
              {...profileForm.register("companyDescription")}
              rows={4}
              className="rounded-xl border-slate-300"
              placeholder="Enter company description..."
            />
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Address Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="streetAddress" className="text-sm font-medium text-slate-700">
                  Street Address
                </Label>
                <Input
                  id="streetAddress"
                  {...profileForm.register("streetAddress")}
                  className="rounded-xl border-slate-300"
                  placeholder="Enter street address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                  City
                </Label>
                <Input
                  id="city"
                  {...profileForm.register("city")}
                  className="rounded-xl border-slate-300"
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateProvince" className="text-sm font-medium text-slate-700">
                  State/Province
                </Label>
                <Input
                  id="stateProvince"
                  {...profileForm.register("stateProvince")}
                  className="rounded-xl border-slate-300"
                  placeholder="Enter state or province"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                  Country
                </Label>
                <Input
                  id="country"
                  {...profileForm.register("country")}
                  className="rounded-xl border-slate-300"
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                profileForm.reset();
                setProfileImage(initialData.profileImage ?? null);
                setProfileImageFile(null);
              }}
              className="rounded-xl border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={(e) => {
                console.log("Save button clicked");
                console.log("Form state:", {
                  isValid: profileForm.formState.isValid,
                  errors: profileForm.formState.errors,
                  isSubmitting: isSubmitting,
                });
              }}
              className="rounded-xl bg-[#1c5bff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

