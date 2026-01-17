"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserCircle, Lock, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Check for success message from registration
  useEffect(() => {
    const registered = searchParams?.get("registered");
    if (registered === "true") {
      setSuccessMessage("Account created successfully! Please login with your credentials.");
      // Clear the URL parameter
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    // Clear any previous validation errors
    form.clearErrors();
    
    try {
      const result = await login({
        username: data.username.trim(),
        password: data.password,
        rememberMe: data.rememberMe || false,
      });

      if (result.success) {
        // Success - redirect to dashboard
        router.push("/");
        router.refresh();
      } else {
        // Handle specific error cases
        const errorMessage = result.error || "Username or password not correct";
        setError(errorMessage);
        
        // Clear password field on error for security
        form.setValue("password", "");
        form.setFocus("password");
      }
    } catch (err) {
      // Handle network errors or unexpected errors
      console.error("Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "Connection failed. Please check your internet and try again.";
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Clear password field on error
      form.setValue("password", "");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Logo Icon */}
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <img 
              src="/lpgnexus-logo.png" 
              alt="LPG Nexus Logo" 
              className="h-20 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">LPG Nexus</h1>
          <p className="mt-2 text-sm text-slate-600">
            Login to your account to access the Cylinder Management System
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 animate-in slide-in-from-top-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="flex-1">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="flex-shrink-0 text-green-600 hover:text-green-800"
                aria-label="Dismiss message"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 animate-in slide-in-from-top-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-slate-700">
              Username
            </Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={form.watch("rememberMe")}
                onCheckedChange={(checked) => form.setValue("rememberMe", checked === true)}
              />
              <Label
                htmlFor="rememberMe"
                className="cursor-pointer text-sm font-normal text-slate-600"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#1c5bff] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* Registration Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-[#1c5bff] hover:underline">
            Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

