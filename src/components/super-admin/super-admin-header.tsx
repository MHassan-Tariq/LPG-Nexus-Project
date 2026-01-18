"use client";

import { ShieldCheck } from "lucide-react";

export function SuperAdminHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-8 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 mb-4">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Control Panel</h1>
          <p className="text-base text-gray-600 mt-1">Manage users, permissions, and system access</p>
        </div>
      </div>
    </div>
  );
}

