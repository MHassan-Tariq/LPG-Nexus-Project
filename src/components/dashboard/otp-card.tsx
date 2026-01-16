"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-retry";
import { log } from "@/lib/logger";

export function OtpCard() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [isLoading, setIsLoading] = useState(false);

  async function requestOtp() {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await apiFetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }
      log.info("OTP requested", { email });
      setStatus("OTP sent. Check your inbox.");
      setStep("verify");
    } catch (error) {
      log.error("Failed to send OTP", error, { email });
      setStatus("Unable to send OTP. Verify SMTP credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await apiFetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!response.ok) {
        throw new Error("Invalid OTP");
      }
      log.info("OTP verified successfully", { email });
      setStatus("OTP verified successfully.");
      setCode("");
    } catch (error) {
      log.error("OTP verification failed", error, { email });
      setStatus("Verification failed. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Secure Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="otp-email">Email</Label>
          <Input
            id="otp-email"
            placeholder="approver@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </div>
        {step === "verify" ? (
          <div className="space-y-2">
            <Label htmlFor="otp-code">One-Time Password</Label>
            <Input
              id="otp-code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={6}
            />
          </div>
        ) : null}
        {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        <div className="flex items-center gap-2">
          <Button onClick={requestOtp} disabled={isLoading || !email}>
            {step === "request" ? "Send OTP" : "Resend"}
          </Button>
          {step === "verify" ? (
            <Button variant="outline" onClick={verifyOtp} disabled={isLoading || code.length !== 6}>
              Verify
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

