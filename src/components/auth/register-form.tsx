"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, Building, Box, UserCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { register } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    businessName: z.string().min(2, "Business name is required"),
    username: z.string().min(2, "Username must be at least 2 characters"),
    isSuperAdmin: z.boolean().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms and Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      businessName: "",
      username: "",
      isSuperAdmin: false,
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    
    // Clear any previous validation errors
    form.clearErrors();
    
    try {
      const result = await register({
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        businessName: data.businessName.trim(),
        username: data.username.trim(),
        isSuperAdmin: data.isSuperAdmin || false,
        password: data.password,
      });

      if (result.success) {
        // Success - redirect to login with success message
        router.push("/login?registered=true");
      } else {
        // Handle specific error cases
        const errorMessage = result.error || "Registration failed. Please try again.";
        setError(errorMessage);
        
        // Clear password fields on error for security
        form.setValue("password", "");
        form.setValue("confirmPassword", "");
        
        // Focus on the first field that might have an error
        if (errorMessage.toLowerCase().includes("email")) {
          form.setFocus("email");
        } else if (errorMessage.toLowerCase().includes("username")) {
          form.setFocus("username");
        } else {
          form.setFocus("fullName");
        }
      }
    } catch (err) {
      // Handle network errors or unexpected errors
      console.error("Registration error:", err);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "Connection failed. Please check your internet and try again.";
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Clear password fields on error
      form.setValue("password", "");
      form.setValue("confirmPassword", "");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl lg:p-10">
        {/* Logo Icon */}
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <img 
              src="/lpgnexus-logo.png" 
              alt="LPG Nexus Logo" 
              className="h-24 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create Your Account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Join LPG Nexus and start managing your cylinder inventory
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Two-Column Layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    {...form.register("fullName")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.fullName && "border-red-300 focus:border-red-500"
                    )}
                  />
                </div>
                {form.formState.errors.fullName && (
                  <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              {/* Username (User Login) */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                  Username (Login) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username for login"
                    {...form.register("username")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.username && "border-red-300 focus:border-red-500"
                    )}
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-xs text-red-600">{form.formState.errors.username.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    {...form.register("phone")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.phone && "border-red-300 focus:border-red-500"
                    )}
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    {...form.register("password")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.password && "border-red-300 focus:border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...form.register("email")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.email && "border-red-300 focus:border-red-500"
                    )}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-slate-700">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Enter your business name"
                    {...form.register("businessName")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.businessName && "border-red-300 focus:border-red-500"
                    )}
                  />
                </div>
                {form.formState.errors.businessName && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    {...form.register("confirmPassword")}
                    disabled={isLoading}
                    className={cn(
                      "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                      form.formState.errors.confirmPassword && "border-red-300 focus:border-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Super Admin Checkbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="isSuperAdmin"
                checked={form.watch("isSuperAdmin")}
                onCheckedChange={(checked) => form.setValue("isSuperAdmin", checked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor="isSuperAdmin"
                className="flex-1 cursor-pointer text-sm font-medium text-slate-700 leading-relaxed"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#1c5bff]" />
                  <span>Create as Super Admin</span>
                </div>
                <p className="mt-1 text-xs font-normal text-slate-500">
                  Super Admin has full system access and cannot be deleted during factory reset
                </p>
              </Label>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Password must contain:</p>
            <ul className="space-y-1 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>At least 8 characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Mix of letters and numbers recommended</span>
              </li>
            </ul>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={form.watch("agreeToTerms")}
              onCheckedChange={(checked) => form.setValue("agreeToTerms", checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="agreeToTerms"
              className="cursor-pointer text-sm font-normal text-slate-600 leading-relaxed"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-[#1c5bff] hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#1c5bff] hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {form.formState.errors.agreeToTerms && (
            <p className="text-xs text-red-600">{form.formState.errors.agreeToTerms.message}</p>
          )}

          {/* Create Account Button */}
          <Button
            type="submit"
            loading={isLoading}
            className="h-12 w-full rounded-xl bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Create Account
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1c5bff] hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

