"use client";

import { AlertCircle } from "lucide-react";

export function EditRestrictedMessage() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-red-900">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">Access Restricted</p>
      </div>
      <p className="mt-2 text-sm text-red-700">
        You are restricted by the super admin. You can only view this page. Editing and actions are not allowed.
      </p>
    </div>
  );
}
