"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccessLevel = "FULL_ACCESS" | "VIEW_ONLY" | "EDIT" | "NO_ACCESS" | "NOT_SHOW";

interface ModulePermission {
  module: string;
  access: AccessLevel;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: any;
}

interface ManagePermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSuccess: () => void;
}

const modules = [
  { id: "dashboard", label: "Dashboard" },
  { id: "addCylinder", label: "Add Cylinder" },
  { id: "addCustomer", label: "Add Customer" },
  { id: "payments", label: "Payments" },
  { id: "paymentLogs", label: "Payment Logs" },
  { id: "expenses", label: "Expenses" },
  { id: "inventory", label: "Inventory" },
  { id: "reports", label: "Reports" },
  { id: "notes", label: "Notes" },
  { id: "settings", label: "Settings" },
  { id: "backup", label: "Backup" },
  { id: "restore", label: "Restore" },
  { id: "profile", label: "Profile" },
  { id: "billReportDesigner", label: "Bill & Report Designer" },
  { id: "superAdminAccess", label: "Super Admin Access" },
];

const accessLevelColors: Record<AccessLevel, string> = {
  FULL_ACCESS: "bg-green-100 text-green-700 border-green-300 hover:bg-green-100 hover:text-green-700 hover:border-green-300",
  VIEW_ONLY: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300",
  EDIT: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-300",
  NO_ACCESS: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-300",
  NOT_SHOW: "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300",
};

const accessLevelLabels: Record<AccessLevel, string> = {
  FULL_ACCESS: "Full Access",
  VIEW_ONLY: "View Only",
  EDIT: "Edit",
  NO_ACCESS: "No Access",
  NOT_SHOW: "Not Show",
};

export function ManagePermissionsModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ManagePermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<string, AccessLevel>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize when modal opens or user changes
    if (open && user) {
      // Check if user has permissions (could be null, undefined, or empty object)
      if (user.permissions && typeof user.permissions === "object" && Object.keys(user.permissions).length > 0) {
        // User has saved permissions, use them
        setPermissions(user.permissions as Record<string, AccessLevel>);
      } else {
        // No saved permissions, initialize with default permissions based on role
        const defaults: Record<string, AccessLevel> = {};
        modules.forEach((module) => {
          if (module.id === "superAdminAccess") {
            defaults[module.id] = "NO_ACCESS";
          } else if (user.role === UserRole.VIEWER) {
            defaults[module.id] = "VIEW_ONLY";
          } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
            // Only SUPER_ADMIN gets FULL_ACCESS, ADMIN gets EDIT
            defaults[module.id] = user.role === UserRole.SUPER_ADMIN ? "FULL_ACCESS" : "EDIT";
          } else {
            defaults[module.id] = "EDIT";
          }
        });
        setPermissions(defaults);
      }
    }
  }, [user, open]);

  const handleAccessChange = (moduleId: string, access: AccessLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: access,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to save permissions");
        return;
      }

      // Refresh the user list to get updated permissions
      onSuccess();
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 300);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {modules.map((module) => {
              const currentAccess = permissions[module.id] || "NO_ACCESS";
              return (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{module.label}</span>
                    <Badge className={accessLevelColors[currentAccess]}>
                      {accessLevelLabels[currentAccess]}
                    </Badge>
                  </div>
                  <Select
                    value={currentAccess}
                    onValueChange={(value) =>
                      handleAccessChange(module.id, value as AccessLevel)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only allow FULL_ACCESS for SUPER_ADMIN role */}
                      {user.role === UserRole.SUPER_ADMIN ? (
                        <>
                          <SelectItem value="FULL_ACCESS">Full Access</SelectItem>
                          <SelectItem value="EDIT">Edit</SelectItem>
                          <SelectItem value="VIEW_ONLY">View Only</SelectItem>
                          <SelectItem value="NO_ACCESS">No Access</SelectItem>
                            <SelectItem value="NOT_SHOW">Not Show</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="EDIT">Edit</SelectItem>
                          <SelectItem value="VIEW_ONLY">View Only</SelectItem>
                          <SelectItem value="NO_ACCESS">No Access</SelectItem>
                            <SelectItem value="NOT_SHOW">Not Show</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="h-12 px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20 disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save All Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

