"use client";

import { ShieldCheck } from "lucide-react";

export function SuperAdminHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Super Admin Control Panel</h1>
          <p className="text-sm text-gray-600 mt-0.5">Manage users, permissions, and system access</p>
        </div>
      </div>
    </div>
  );
}

