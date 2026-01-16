"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
      <div className="max-w-md w-full rounded-[24px] border border-red-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access Denied</h1>
          <p className="mb-6 text-slate-600">
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-[#1f64ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a56e6]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
