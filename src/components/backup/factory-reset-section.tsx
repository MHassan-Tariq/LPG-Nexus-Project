"use client";

import { useState, useTransition, useEffect } from "react";
import { Trash2, AlertTriangle, Lock, Clock, RefreshCw } from "lucide-react";
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
import { requestFactoryResetOtp, performFactoryReset, getAdminEmail } from "@/app/backup/actions";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { useRouter } from "next/navigation";

export function FactoryResetSection() {
  const router = useRouter();
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isRequestingOtp, startRequestingOtp] = useTransition();
  const [isResetting, startResetting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canResend, setCanResend] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Fetch admin email on mount
    getAdminEmail().then((email) => {
      if (email) setAdminEmail(email);
    });
  }, []);

  useEffect(() => {
    if (!otpExpiresAt) return;

    const interval = setInterval(() => {
      const remaining = differenceInSeconds(otpExpiresAt, new Date());
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        setCanResend(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  function handleOpenModal() {
    setOtpModalOpen(true);
    setOtpCode("");
    setError(null);
    setSuccess(null);
    setCanResend(false);
    requestOtp();
  }

  function requestOtp() {
    startRequestingOtp(async () => {
      setError(null);
      setSuccess(null);
      try {
        const result = await requestFactoryResetOtp();
        if (result.success && result.expiresAt) {
          setOtpExpiresAt(new Date(result.expiresAt));
          setTimeRemaining(differenceInSeconds(new Date(result.expiresAt), new Date()));
          setCanResend(false);
          setSuccess("Verification code sent to your admin email. Please check your inbox.");
        } else {
          setError(result.error || "Failed to send verification code");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error("OTP request error:", err);
      }
    });
  }

  function handleResendOtp() {
    setOtpCode("");
    setError(null);
    setSuccess(null);
    requestOtp();
  }

  function handlePerformReset() {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    startResetting(async () => {
      setError(null);
      setSuccess(null);
      try {
        const result = await performFactoryReset(otpCode);
        if (result.success) {
          setSuccess(result.message || "Factory reset completed successfully!");
          // Reload the page after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        } else {
          setError(result.error || "Failed to perform factory reset");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Factory reset error:", err);
      }
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const isOtpValid = otpCode.length === 6;
  const isExpired = timeRemaining <= 0;

  return (
    <>
      {/* Factory Reset Section */}
      <div className="rounded-[32px] border-2 border-red-200 bg-gradient-to-br from-red-50/50 to-orange-50/50 p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Reset Software / Delete All Data</h2>
            <p className="text-sm text-slate-500">Permanently erase all data and restore to factory settings</p>
          </div>
        </div>

        <div className="mb-6 rounded-[20px] border-2 border-red-200 bg-white p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-red-900">
                ⚠️ This operation is IRREVERSIBLE
              </h3>
              <p className="text-sm text-slate-700">
                Performing a factory reset will permanently delete <strong>ALL</strong> data from your system,
                restoring it to a brand-new state as if freshly installed. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-red-900">The following will be permanently deleted:</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>All customer records and information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>Complete cylinder inventory and delivery history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>All payment logs and billing data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>Expense records and transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>Notes and daily journal entries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>Backup records and restore history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>System settings and customizations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-red-600">•</span>
                <span>All user accounts except Super Admin</span>
              </li>
            </ul>
          </div>

          <p className="text-sm font-medium text-slate-900">
            Only the <strong>Super Admin account</strong> will be preserved. All other data will be permanently erased.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenModal}
          disabled={isRequestingOtp}
          className="h-12 w-full rounded-[18px] border-2 border-red-600 bg-red-600 text-base font-semibold text-white hover:bg-red-700 hover:border-red-700 disabled:opacity-60"
        >
          <Trash2 className="mr-2 h-5 w-5" />
          Delete All Data (Factory Reset)
        </Button>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-red-900">
              <Lock className="h-6 w-6" />
              Verify Factory Reset
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Enter the verification code sent to {adminEmail || "your admin email"} to confirm this action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Final Warning</p>
                  <p className="mt-1 text-xs text-slate-700">
                    This action will permanently delete ALL data. Ensure you have a backup before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp-code" className="text-sm font-medium text-slate-700">
                Verification Code
              </Label>
              <div className="relative">
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setOtpCode(value);
                    setError(null);
                  }}
                  placeholder="Enter 6-digit code"
                  className="h-12 rounded-xl border-slate-300 bg-slate-50 text-center text-lg font-mono tracking-widest transition-colors focus:border-[#1c5bff] focus:bg-white"
                />
              </div>
              {timeRemaining > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="h-3 w-3" />
                  <span>Code expires in: {formatTime(timeRemaining)}</span>
                </div>
              )}
              {isExpired && (
                <p className="text-xs text-red-600">Verification code has expired. Please request a new one.</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOtpModalOpen(false);
                setOtpCode("");
                setError(null);
                setSuccess(null);
                setOtpExpiresAt(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {canResend && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOtp}
                disabled={isRequestingOtp}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRequestingOtp ? "Sending..." : "Resend Code"}
              </Button>
            )}
            <Button
              type="button"
              onClick={handlePerformReset}
              disabled={!isOtpValid || isExpired || isResetting}
              className="w-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
            >
              {isResetting ? "Resetting..." : "Permanently Delete All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

