"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Building, MapPin, Calendar, Shield, CheckCircle, XCircle, Clock, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserRole, UserStatus } from "@prisma/client";

interface UserAccountData {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  businessName: string | null;
  branch: string | null;
        department: string | null;
        profileImage: string | null;
        streetAddress: string | null;
        city: string | null;
        stateProvince: string | null;
        country: string | null;
        companyDescription: string | null;
        adminId: string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export function UserAccountView({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserAccountData | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUserAccount();
  }, [userId]);

  async function fetchUserAccount() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch user account");
      }
      const data = await response.json();
      setUser(data.user);
      setTenantUsers(data.tenantUsers || []);
    } catch (err) {
      console.error("Error fetching user account:", err);
      setError(err instanceof Error ? err.message : "Failed to load user account");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteTenantUser() {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/super-admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully.");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      // Refresh the tenant users list
      await fetchUserAccount();
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "bg-purple-100 text-purple-700 border-purple-200";
      case UserRole.ADMIN:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case UserRole.STAFF:
        return "bg-green-100 text-green-700 border-green-200";
      case UserRole.VIEWER:
        return "bg-gray-100 text-gray-700 border-gray-200";
      case UserRole.BRANCH_MANAGER:
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || "User not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">User Account</h1>
            <p className="text-sm text-slate-500">View user account details</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImage ?? undefined} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
                <Badge className={`rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role.replace("_", " ")}
                </Badge>
                {user.isVerified ? (
                  <Badge className="rounded-full bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="rounded-full bg-orange-100 text-orange-700 border-orange-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
                <Badge
                  className={`rounded-full ${
                    user.status === UserStatus.ACTIVE
                      ? "bg-green-100 text-green-700 border-green-200"
                      : user.status === UserStatus.SUSPENDED
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {user.status}
                </Badge>
              </div>
              {user.username && (
                <p className="text-sm text-slate-500">@{user.username}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </h3>
              <div className="space-y-3">
                {user.businessName && (
                  <div>
                    <p className="text-xs text-slate-500">Business Name</p>
                    <p className="text-sm font-medium text-slate-900">{user.businessName}</p>
                  </div>
                )}
                {user.branch && (
                  <div>
                    <p className="text-xs text-slate-500">Branch</p>
                    <p className="text-sm font-medium text-slate-900">{user.branch}</p>
                  </div>
                )}
                {user.department && (
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="text-sm font-medium text-slate-900">{user.department}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {(user.streetAddress || user.city || user.stateProvince || user.country) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </h3>
                <div className="space-y-1">
                  {user.streetAddress && (
                    <p className="text-sm text-slate-900">{user.streetAddress}</p>
                  )}
                  <p className="text-sm text-slate-600">
                    {[user.city, user.stateProvince, user.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Joined</p>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(user.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Last Login</p>
                      <p className="text-sm font-medium text-slate-900">
                        {format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Description */}
            {user.companyDescription && (
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900">Company Description</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{user.companyDescription}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Users Section - Only show if user is an ADMIN */}
      {user.role === UserRole.ADMIN && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                <CardTitle>Tenant Users</CardTitle>
                <Badge className="rounded-full bg-blue-100 text-blue-700 border-blue-200">
                  {tenantUsers.length}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              All users created by {user.name} ({user.email})
            </p>
          </CardHeader>
          <CardContent>
            {tenantUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No users created by this admin yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantUsers.map((tenantUser) => (
                      <TableRow key={tenantUser.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={tenantUser.profileImage ?? undefined} alt={tenantUser.name} />
                              <AvatarFallback>
                                {tenantUser.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900">{tenantUser.name}</p>
                              {tenantUser.username && (
                                <p className="text-xs text-slate-500">@{tenantUser.username}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-900">{tenantUser.email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600">{tenantUser.phone || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`rounded-full ${getRoleBadgeColor(tenantUser.role)}`}>
                            {tenantUser.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full ${
                              tenantUser.status === UserStatus.ACTIVE
                                ? "bg-green-100 text-green-700 border-green-200"
                                : tenantUser.status === UserStatus.SUSPENDED
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {tenantUser.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-600">
                            {format(new Date(tenantUser.createdAt), "dd/MM/yyyy")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setUserToDelete(tenantUser);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 hover:bg-red-100 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}&apos;s account ({userToDelete?.email})? 
              This action cannot be undone and will remove all data associated with this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenantUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

