"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Mail, Phone, Building, Key, Users } from "lucide-react";
import { UserRole } from "@prisma/client";

interface SuperAdminInfo {
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  businessName: string | null;
  role: UserRole;
  status: string;
  isVerified?: boolean;
  branch?: string | null;
  createdAt?: string;
  lastLogin?: string | null;
  totalDeliveries?: number;
}

interface SuperAdminInfoCardProps {
  selectedUserId?: string | null;
}

export function SuperAdminInfoCard({ selectedUserId }: SuperAdminInfoCardProps) {
  const [superAdmin, setSuperAdmin] = useState<SuperAdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);
      try {
        if (selectedUserId) {
          // Fetch specific user details
          const response = await fetch(`/api/super-admin/users/${selectedUserId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setSuperAdmin(data.user);
            }
          }
        } else {
          // Fetch current logged-in user details (default)
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setSuperAdmin(data.user);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [selectedUserId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading super admin info...</div>
        </CardContent>
      </Card>
    );
  }

  if (!superAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 mb-4">
          <Shield className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedUserId ? "User Account Details" : "My Account Details"}
          </h2>
          <p className="text-gray-600 mt-1">
            {selectedUserId ? "View and manage specific user Profile components" : "Manage your super admin credentials and profile"}
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Profile Information</h3>
            </div>
            <Badge className="bg-blue-600 text-white">
              {superAdmin.role.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-base font-semibold text-gray-900">{superAdmin.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-base font-semibold text-gray-900">{superAdmin.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Username</p>
              <p className="text-base font-semibold text-gray-900">
                {superAdmin.username || "Not set"}
              </p>
            </div>
          </div>

          {superAdmin.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-base font-semibold text-gray-900">{superAdmin.phone}</p>
              </div>
            </div>
          )}

          {superAdmin.businessName && (
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Business</p>
                <p className="text-base font-semibold text-gray-900">{superAdmin.businessName}</p>
              </div>
            </div>
          )}

          {superAdmin.branch && (
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Branch</p>
                <p className="text-base font-semibold text-gray-900">{superAdmin.branch}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-600">Status</p>
              <Badge 
                className={`mt-1 ${
                  superAdmin.status === "SUSPENDED" 
                    ? "bg-red-100 text-red-700"
                    : superAdmin.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {superAdmin.status === "SUSPENDED" 
                  ? "Suspended"
                  : superAdmin.isVerified
                  ? "Verified"
                  : "Pending"}
              </Badge>
            </div>
          </div>
        </div>

        {(superAdmin.createdAt || superAdmin.totalDeliveries !== undefined) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {superAdmin.createdAt && (
                <div>
                  <span className="text-slate-600">Registered:</span>{" "}
                  <span className="text-slate-900 font-medium">
                    {new Date(superAdmin.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {superAdmin.lastLogin && (
                <div>
                  <span className="text-slate-600">Last Login:</span>{" "}
                  <span className="text-slate-900 font-medium">
                    {new Date(superAdmin.lastLogin).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {superAdmin.totalDeliveries !== undefined && (
                <div>
                  <span className="text-slate-600">Total Deliveries:</span>{" "}
                  <span className="text-slate-900 font-medium">{superAdmin.totalDeliveries}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <p className="text-xs font-medium text-gray-900 mb-2">🔐 Login Credentials</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Username:</span>
              <span className="font-mono font-semibold text-gray-900">{superAdmin.username || "Not set"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-mono text-gray-900">{superAdmin.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Password is encrypted for security. Use "Forgot Password" to reset if needed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
