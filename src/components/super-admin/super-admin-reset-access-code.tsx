"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SuperAdminResetAccessCode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newAccessCode, setNewAccessCode] = useState("");
  const [confirmAccessCode, setConfirmAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; username?: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Get email and token from URL params
    const email = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (!email || !tokenParam) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setToken(tokenParam);

    // Fetch user info using the token
    async function fetchUserInfo() {
      try {
        const response = await fetch(`/api/super-admin/get-user-info?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data.user);
        } else {
          setError("Failed to load user information.");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to load user information.");
      }
    }

    fetchUserInfo();

    // Start 10-minute countdown timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 600 - elapsed); // 10 minutes = 600 seconds
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = async () => {
    if (isExpired || timeRemaining <= 0) {
      setError("Token has expired. Please request a new reset link.");
      return;
    }

    if (!newAccessCode.trim() || newAccessCode.length < 6) {
      setError("OTP must be at least 6 characters");
      return;
    }

    if (newAccessCode !== confirmAccessCode) {
      setError("OTP codes do not match");
      return;
    }

    if (!token) {
      setError("Invalid session. Please request a new reset link.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const email = searchParams.get("email");
      const response = await fetch("/api/super-admin/reset-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newAccessCode: newAccessCode,
          token: token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset access code");
        return;
      }

      // Success - redirect to login or access page
      setTimeout(() => {
        router.push("/super-admin?reset=success");
      }, 1500);
    } catch (err: any) {
      console.error("Reset error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-2xl font-semibold text-slate-900">Reset Access Code</h1>
            <p className="mt-2 text-sm text-slate-600">Enter your new access code</p>
          </div>

          {/* User Info Display */}
          {userInfo && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Name:</span>
                  <span className="text-sm text-blue-800">{userInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Email:</span>
                  <span className="text-sm text-blue-800">{userInfo.email}</span>
                </div>
                {userInfo.username && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Username:</span>
                    <span className="text-sm text-blue-800">{userInfo.username}</span>
                  </div>
                )}
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

          {/* Timer Display */}
          <div
            className={`mb-4 rounded-xl border p-4 ${
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
                    ? "Token Expired"
                    : `Token expires in: ${formatTime(timeRemaining)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Password Fields */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newAccessCode" className="text-sm font-medium text-slate-700">
                OTP
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="newAccessCode"
                  type={showPassword ? "text" : "password"}
                  value={newAccessCode}
                  onChange={(e) => setNewAccessCode(e.target.value)}
                  placeholder="Enter OTP (min. 6 characters)"
                  disabled={isLoading || isExpired}
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

            <div className="space-y-2">
              <Label htmlFor="confirmAccessCode" className="text-sm font-medium text-slate-700">
                Confirm OTP
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirmAccessCode"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmAccessCode}
                  onChange={(e) => setConfirmAccessCode(e.target.value)}
                  placeholder="Confirm OTP"
                  disabled={isLoading || isExpired}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleReset();
                    }
                  }}
                  className={cn(
                    "h-12 rounded-xl border-slate-300 bg-slate-50 pl-10 pr-10 transition-colors hover:border-slate-400 focus:border-[#1c5bff] focus:bg-white",
                    error && "border-red-300 focus:border-red-500"
                  )}
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

            {/* Reset Button */}
            <Button
              onClick={handleReset}
              disabled={isLoading || !newAccessCode.trim() || !confirmAccessCode.trim() || isExpired}
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
                  Resetting...
                </span>
              ) : isExpired ? (
                "Token Expired"
              ) : (
                "Reset Access Code"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
