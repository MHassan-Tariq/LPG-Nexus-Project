"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings, Upload, Save, X, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettings } from "@/app/(dashboard)/settings/actions";

const settingsSchema = z.object({
  softwareName: z.string().min(1, "Software name is required").max(100, "Software name is too long"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialSettings: {
    softwareName: string;
    softwareLogo: string | null;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.softwareLogo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      softwareName: initialSettings.softwareName,
    },
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        setNotification({ message: "Please select a PNG, JPG, or SVG file", type: "error" });
        return;
      }

      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({ message: "File size must be less than 5MB", type: "error" });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Form submitted with:", {
        softwareName: data.softwareName,
        hasLogoFile: !!logoFile,
        hasLogoPreview: !!logoPreview,
      });

      // Convert logo file to base64 if a new file was selected
      let logoDataUrl: string | null = logoPreview;
      if (logoFile) {
        console.log("Converting logo file to base64...");
        const base64Promise = new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log("Logo converted, length:", result.length);
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error("Error reading logo file:", error);
            reject(error);
          };
          reader.readAsDataURL(logoFile);
        });
        logoDataUrl = await base64Promise;
      }

      console.log("Saving settings:", {
        softwareName: data.softwareName.trim(),
        hasLogo: !!logoDataUrl,
        logoLength: logoDataUrl?.length || 0,
      });

      const result = await saveSettings({
        softwareName: data.softwareName.trim(),
        softwareLogo: logoDataUrl,
      });

      console.log("Save settings result:", result);

      if (result.success) {
        toast.warning("Settings saved successfully.");
        setNotification({ message: result.message || "Settings saved successfully!", type: "success" });
        // Update local state with saved values
        initialSettings.softwareName = data.softwareName.trim();
        if (logoDataUrl) {
          initialSettings.softwareLogo = logoDataUrl;
        }
        // Update form
        form.reset({ softwareName: data.softwareName.trim() });
        // Reset file input
        setLogoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh the page to show updated settings
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        const errorMsg = result.error || "Failed to save settings. Please check the browser console for details.";
        toast.error(errorMsg);
        setNotification({ 
          message: errorMsg, 
          type: "error" 
        });
        console.error("Failed to save settings:", result.error);
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(errorMsg);
      setNotification({
        message: errorMsg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    form.reset({ softwareName: initialSettings.softwareName });
    setLogoPreview(initialSettings.softwareLogo);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Default logo SVG (flame with gradient - matching the actual logo)
  const defaultLogo = (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <defs>
        <linearGradient id="grad-red" x1="18" y1="96" x2="56" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E52D27" />
          <stop offset="1" stopColor="#F7941D" />
        </linearGradient>
        <linearGradient id="grad-blue" x1="60" y1="18" x2="110" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4AA5F8" />
          <stop offset="1" stopColor="#0057A4" />
        </linearGradient>
      </defs>
      <path d="M52 16C30 44 28 62 32 77C36.5 94.5 24 110 14 116C32 122 54 118 66 94C76 74 72 40 52 16Z" fill="url(#grad-red)" />
      <path d="M74 14C96 40 104 60 102 82C100 106 84 120 58 120C94 120 118 92 118 64C118 40 102 20 82 14C80 13.5 76 14 74 14Z" fill="url(#grad-blue)" />
      <path d="M64 18C84 48 82 78 70 102C62 118 50 124 36 124C66 122 84 94 84 64C84 46 76 30 64 18Z" fill="white" fillOpacity="0.92" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            "fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all",
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Card with Software Name Section */}
        <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff]">
              <Settings className="h-5 w-5 text-[#2544d6]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Software Settings</h1>
              <p className="text-sm text-slate-500">Customize your software name and branding</p>
            </div>
          </div>

          {/* Software Name Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Software Name</h2>
            <p className="text-sm text-slate-500">Change the display name of your software throughout the application</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="softwareName" className="text-sm font-medium text-slate-700">
              Software Name
            </Label>
            <Input
              id="softwareName"
              {...form.register("softwareName")}
              placeholder="Enter software name"
              className="rounded-xl border-slate-300 bg-slate-50"
            />
            {form.formState.errors.softwareName && (
              <p className="text-xs text-red-600">{form.formState.errors.softwareName.message}</p>
            )}
            <p className="text-xs text-slate-500">This name will appear in the sidebar and throughout the application</p>
          </div>

          {/* Current Display Info Box */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-600 mb-1">Current Display:</p>
            <p className="text-base font-semibold text-slate-900">{form.watch("softwareName") || initialSettings.softwareName}</p>
          </div>
        </div>

        {/* Software Logo Section Card */}
        <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-6 shadow-none lg:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Software Logo</h2>
            <p className="text-sm text-slate-500">
              Upload a new logo for your software (PNG, JPG, or SVG - Max 5MB)
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <p className="text-sm font-medium text-slate-700 mb-3">Current Logo</p>
              <div className="relative flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Software Logo"
                    width={120}
                    height={120}
                    className="h-full w-full rounded-xl object-contain p-2"
                  />
                ) : (
                  <div className="flex items-center justify-center">{defaultLogo}</div>
                )}
              </div>
            </div>

            {/* Upload Button and Guidelines */}
            <div className="flex-1 space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 rounded-xl border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Logo
                </Button>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Recommended size: 200x200 pixels</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Accepted formats: PNG, JPG, SVG</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Maximum file size: 5MB</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Outside Cards */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Changes will be applied immediately after saving</p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="rounded-xl border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 rounded-xl bg-[#1c5bff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

