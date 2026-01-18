"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Box, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resetPassword } from "@/app/auth/actions";

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const requestForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Start countdown timer when step changes to "reset"
  useEffect(() => {
    if (step === "reset") {
      setTimeRemaining(600); // Reset to 10 minutes
      setIsExpired(false);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [step]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  async function onRequestReset(data: RequestResetFormValues) {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await requestPasswordReset(data.email);
      if (result.success) {
        setEmail(data.email);
        setStep("reset");
        setMessage({ type: "success", text: result.message || "Reset code sent to your email" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to send reset code" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
      console.error("Request reset error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(data: ResetPasswordFormValues) {
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await resetPassword(email, data.code, data.newPassword);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Password reset successfully!" });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to reset password" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Logo Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c5bff]">
            <Box className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-600">
            {step === "request"
              ? "Enter your email to receive a reset code"
              : "Enter the code sent to your email and your new password"}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...requestForm.register("email")}
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                />
              </div>
              {requestForm.formState.errors.email && (
                <p className="text-xs text-red-600">{requestForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="h-12 w-full rounded-xl bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
            >
              Send Reset Code
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
            {/* OTP Expiration Timer */}
            <div
              className={`rounded-xl border p-4 ${
                isExpired
                  ? "border-red-200 bg-red-50"
                  : timeRemaining < 120
                    ? "border-orange-200 bg-orange-50"
                    : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock
                    className={`h-4 w-4 ${
                      isExpired
                        ? "text-red-600"
                        : timeRemaining < 120
                          ? "text-orange-600"
                          : "text-blue-600"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isExpired
                        ? "text-red-800"
                        : timeRemaining < 120
                          ? "text-orange-800"
                          : "text-blue-800"
                    }`}
                  >
                    {isExpired
                      ? "Code Expired"
                      : `Code expires in: ${formatTime(timeRemaining)}`}
                  </span>
                </div>
                {isExpired && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStep("request");
                      setTimeRemaining(600);
                      setIsExpired(false);
                    }}
                    className="h-8 text-xs"
                  >
                    Request New Code
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium text-slate-700">
                Reset Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={isExpired}
                {...resetForm.register("code")}
                className="h-12 rounded-xl border-slate-300 bg-slate-50 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {resetForm.formState.errors.code && (
                <p className="text-xs text-red-600">{resetForm.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...resetForm.register("newPassword")}
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-red-600">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  {...resetForm.register("confirmPassword")}
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
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
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-600">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isExpired}
              className="h-12 w-full rounded-xl bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
            >
              {isExpired ? "Code Expired" : "Reset Password"}
            </Button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1c5bff] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

