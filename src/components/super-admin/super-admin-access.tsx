"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail, Clock } from "lucide-react";
import { differenceInSeconds } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";

export function SuperAdminAccess() {
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Forgot Password Modal State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [newAccessCode, setNewAccessCode] = useState("");
  const [confirmAccessCode, setConfirmAccessCode] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // Track if OTP has been verified
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user role on mount and check for forgot email in session
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || null);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }
    fetchUserRole();

    // Check if we have a forgot email in sessionStorage and set flow flag
    const storedForgotEmail = sessionStorage.getItem("superAdminForgotEmail");
    if (storedForgotEmail) {
      setForgotEmail(storedForgotEmail);
      setIsForgotPasswordFlow(true);
    }
  }, []);

  const handleVerify = async () => {
    if (!accessCode.trim()) {
      setError("Please enter the access code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if we're in forgot password flow (have stored email AND explicitly in flow)
      const storedForgotEmail = sessionStorage.getItem("superAdminForgotEmail");
      const inForgotPasswordFlow = isForgotPasswordFlow && Boolean(storedForgotEmail || forgotEmail);
      const emailToUse = forgotEmail || storedForgotEmail;

      // Only include email if we're explicitly in forgot password flow
      const verifyPayload: { accessCode: string; email?: string } = { accessCode };
      if (inForgotPasswordFlow && emailToUse) {
        verifyPayload.email = emailToUse;
      }

      const response = await fetch("/api/super-admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || data.details || "Invalid access code");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Only redirect to reset page if we're explicitly in forgot password flow AND have user data/token
        if (inForgotPasswordFlow && data.user && data.token && emailToUse) {
          // Clear the stored email and flow flag before redirecting
          sessionStorage.removeItem("superAdminForgotEmail");
          setIsForgotPasswordFlow(false);
          router.push(`/super-admin/reset-access-code?email=${encodeURIComponent(emailToUse)}&token=${encodeURIComponent(data.token)}`);
          return;
        }

        // For regular access (no forgot password flow), clear any stale forgot password data
        // and store super admin session, then go to dashboard
        sessionStorage.removeItem("superAdminForgotEmail");
        setIsForgotPasswordFlow(false);
        sessionStorage.setItem("superAdminAuthenticated", "true");
        router.push("/super-admin/dashboard");
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err?.message || "Failed to verify access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleRequestReset = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await fetch("/api/super-admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.error || "Failed to send reset code");
        return;
      }

      // Set expiration time and start timer
      if (data.expiresAt) {
        const expiresAtDate = new Date(data.expiresAt);
        setOtpExpiresAt(expiresAtDate);
        const remaining = Math.max(0, differenceInSeconds(expiresAtDate, new Date()));
        setTimeRemaining(remaining);
        
        // Start countdown timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          const now = new Date();
          const remaining = Math.max(0, differenceInSeconds(expiresAtDate, now));
          setTimeRemaining(remaining);
          if (remaining <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 1000);
      }

      // Move to OTP step
      setForgotStep("otp");
      setForgotSuccess("OTP sent to your email. Please enter the code.");
    } catch (err: any) {
      setForgotError("An unexpected error occurred. Please try again.");
      console.error("Request reset error:", err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setForgotError("Please enter a valid 6-digit OTP code");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error === "expired" 
          ? "OTP has expired. Please request a new one."
          : data.error === "invalid_code"
          ? "Invalid OTP code. Please check and try again."
          : "OTP verification failed. Please try again.";
        setForgotError(errorMessage);
        return;
      }

      // OTP verified successfully, move to password reset step
      setOtpVerified(true); // Mark OTP as verified
      setForgotStep("password");
      setForgotSuccess("OTP verified successfully. Please enter your new access code.");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err: any) {
      setForgotError("An unexpected error occurred. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetAccessCode = async () => {
    if (!newAccessCode.trim() || newAccessCode.length < 6) {
      setForgotError("Access code must be at least 6 characters");
      return;
    }

    if (newAccessCode !== confirmAccessCode) {
      setForgotError("Access codes do not match");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      // Since OTP is already verified, we don't need to send it again
      // The API will accept the reset if OTP was verified in the previous step
      const response = await fetch("/api/super-admin/reset-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          // Don't send OTP code since it's already been verified
          newAccessCode: newAccessCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.error || "Failed to reset access code");
        return;
      }

      setForgotSuccess(data.message || "Access code reset successfully!");
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setForgotStep("email");
        setForgotEmail("");
        setOtpCode("");
        setNewAccessCode("");
        setConfirmAccessCode("");
        setForgotError(null);
        setForgotSuccess(null);
        setIsForgotPasswordFlow(false);
        setOtpVerified(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }, 2000);
    } catch (err: any) {
      setForgotError("An unexpected error occurred. Please try again.");
      console.error("Reset access code error:", err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setForgotPasswordOpen(false);
    setForgotStep("email");
    setForgotEmail("");
    setOtpCode("");
    setNewAccessCode("");
    setConfirmAccessCode("");
    setForgotError(null);
    setForgotSuccess(null);
    setOtpExpiresAt(null);
    setTimeRemaining(600);
    setOtpVerified(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Don't clear isForgotPasswordFlow here - keep it if email was sent
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          {/* Shield Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1c5bff]">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Super Admin Access</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your access code to continue to the admin dashboard
            </p>
          </div>

          {/* Warning Note */}
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                This area is restricted to authorized super administrators only. Unauthorized access is strictly prohibited.
              </p>
            </div>
          </div>

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

          {/* Success Message (for forgot password flow) */}
          {forgotSuccess && (
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
                <span className="flex-1">{forgotSuccess}</span>
                <button
                  type="button"
                  onClick={() => setForgotSuccess(null)}
                  className="flex-shrink-0 text-green-600 hover:text-green-800"
                  aria-label="Dismiss success"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Access Code Input */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-sm font-medium text-slate-700">
                Access Code
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="accessCode"
                  type={showPassword ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerify();
                    }
                  }}
                  placeholder="Enter access code"
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                    error && "border-red-300 focus:border-red-500"
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
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isLoading || !accessCode.trim()}
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
                  Verifying...
                </span>
              ) : (
                "Verify Access Code"
              )}
            </Button>

            {/* Forgot Password Link - Only show for SUPER_ADMIN */}
            {userRole === UserRole.SUPER_ADMIN && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm font-medium text-[#1c5bff] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Shield className="h-6 w-6" />
              Reset Access Code
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {forgotStep === "email"
                ? "Enter your super admin email to receive a reset code"
                : forgotStep === "otp"
                ? "Enter the OTP code sent to your email"
                : "Enter your new access code"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {forgotError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === "email" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-slate-700">
                    Super Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={forgotLoading}
                      className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : forgotStep === "otp" ? (
              <div className="space-y-4">
                {/* Timer Display */}
                {otpExpiresAt && (
                  <div
                    className={`rounded-xl border p-4 ${
                      timeRemaining < 120
                        ? "border-orange-200 bg-orange-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`h-4 w-4 ${
                          timeRemaining < 120 ? "text-orange-600" : "text-blue-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          timeRemaining < 120 ? "text-orange-800" : "text-blue-800"
                        }`}
                      >
                        {timeRemaining > 0
                          ? `OTP expires in: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, "0")}`
                          : "OTP expired. Please request a new one."}
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="otp-code" className="text-sm font-medium text-slate-700">
                    OTP Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="otp-code"
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtpCode(value);
                      }}
                      placeholder="Enter 6-digit OTP"
                      disabled={forgotLoading || timeRemaining <= 0}
                      maxLength={6}
                      className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 text-center text-lg font-semibold tracking-widest transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-access-code" className="text-sm font-medium text-slate-700">
                    New Access Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="new-access-code"
                      type={showNewPassword ? "text" : "password"}
                      value={newAccessCode}
                      onChange={(e) => setNewAccessCode(e.target.value)}
                      placeholder="Enter new access code (min. 6 characters)"
                      disabled={forgotLoading}
                      className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-access-code" className="text-sm font-medium text-slate-700">
                    Confirm Access Code
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm-access-code"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmAccessCode}
                      onChange={(e) => setConfirmAccessCode(e.target.value)}
                      placeholder="Confirm new access code"
                      disabled={forgotLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleResetAccessCode();
                        }
                      }}
                      className="h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseForgotModal}
              className="h-12 w-full rounded-xl border-slate-300 bg-white px-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
            >
              Cancel
            </Button>
            {forgotStep === "email" ? (
              <Button
                type="button"
                onClick={handleRequestReset}
                disabled={forgotLoading || !forgotEmail.trim()}
                className="h-12 w-full px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20 disabled:opacity-60 sm:w-auto"
              >
                {forgotLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            ) : forgotStep === "otp" ? (
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={forgotLoading || otpCode.length !== 6 || timeRemaining <= 0}
                className="h-12 w-full px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20 disabled:opacity-60 sm:w-auto"
              >
                {forgotLoading ? "Verifying..." : timeRemaining <= 0 ? "OTP Expired" : "Verify OTP"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleResetAccessCode}
                disabled={forgotLoading || newAccessCode.length < 6 || newAccessCode !== confirmAccessCode}
                className="h-12 w-full px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20 disabled:opacity-60 sm:w-auto"
              >
                {forgotLoading ? "Resetting..." : "Reset Access Code"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

