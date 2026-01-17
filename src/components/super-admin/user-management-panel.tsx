"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, UserPlus, Trash2, Shield, Check, X, Lock, Unlock, Eye, MoreVertical, Edit, UserCog, User } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { useSearch } from "@/hooks/use-search";
import { apiFetch, apiFetchJson } from "@/lib/api-retry";
import { log } from "@/lib/logger";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginatedResponse } from "@/core/data/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole, UserStatus } from "@prisma/client";
import { CreateUserModal } from "./create-user-modal";
import { EditUserSheet } from "./edit-user-sheet";
import { ManagePermissionsModal } from "./manage-permissions-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";

interface User {
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
  profileImage: string | null;
  permissions?: any;
  createdAt: string;
  lastLogin: string | null;
  totalDeliveries: number;
}

interface UserManagementPanelProps {
  onViewUser?: (userId: string) => void;
  variant?: "table" | "cards";
}

export function UserManagementPanel({ onViewUser, variant = "table" }: UserManagementPanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  
  // Use hooks for search and pagination
  const { query: searchQuery, resolvedQuery, setQuery: setSearchQuery } = useSearch({
    debounceMs: 300,
    paramName: "search",
  });
  const { page, pageSize, setPage, totalPages } = usePagination(total, {
    initialPageSize: 5,
  });
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (resolvedQuery) params.append("search", resolvedQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (variant === "table") {
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());
      }


      const startTime = Date.now();
      const data = await apiFetchJson<PaginatedResponse<User>>(`/api/super-admin/users?${params.toString()}`);
      const duration = Date.now() - startTime;
      log.api("GET", `/api/super-admin/users`, 200, duration, { 
        search: resolvedQuery, 
        role: roleFilter, 
        status: statusFilter 
      });
      if (variant === "table") {
        setUsers(data.data || []);
        setTotal(data.total || 0);
      } else {
        setUsers(data.data || []);
      }
    } catch (error) {
      log.error("Error fetching users", error, { 
        search: resolvedQuery, 
        role: roleFilter, 
        status: statusFilter 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedQuery, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (variant === "table") {
      setPage(1);
    }
    // Reset showAllCards when filters change
    if (variant === "cards") {
      setShowAllCards(false);
    }
  }, [resolvedQuery, roleFilter, statusFilter, variant, setPage]);

  const handleToggleVerification = async (user: User) => {
    try {
      const response = await apiFetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !user.isVerified, status: !user.isVerified ? UserStatus.ACTIVE : UserStatus.PENDING }),
      });

      if (response.ok) {
        log.info("User verification toggled", { userId: user.id, isVerified: !user.isVerified });
        toast.warning(`User ${!user.isVerified ? "verified" : "unverified"} successfully.`);
        fetchUsers();
      } else {
        const errorMsg = "Failed to update user verification";
        toast.error(errorMsg);
      }
    } catch (error) {
      log.error("Error updating user verification", error, { userId: user.id });
      const errorMsg = error instanceof Error ? error.message : "Failed to update user verification";
      toast.error(errorMsg);
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    try {
      const response = await apiFetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        log.info("User role updated", { userId: user.id, newRole });
        toast.warning("User role updated successfully.");
        fetchUsers();
      } else {
        const errorMsg = "Failed to update user role";
        toast.error(errorMsg);
      }
    } catch (error) {
      log.error("Error updating user role", error, { userId: user.id, newRole });
      const errorMsg = error instanceof Error ? error.message : "Failed to update user role";
      toast.error(errorMsg);
    }
  };

  const handleToggleSuspend = async (user: User) => {
    try {
      const newStatus = user.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
      const response = await apiFetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        log.info("User status updated", { userId: user.id, newStatus });
        toast.warning(`User ${newStatus === UserStatus.SUSPENDED ? "suspended" : "activated"} successfully.`);
        fetchUsers();
      } else {
        const errorMsg = "Failed to update user status";
        toast.error(errorMsg);
      }
    } catch (error) {
      log.error("Error updating user status", error, { userId: user.id });
      const errorMsg = error instanceof Error ? error.message : "Failed to update user status";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await apiFetch(`/api/super-admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        log.info("User deleted", { userId: userToDelete.id });
        toast.error("User deleted successfully.");
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        const result = await response.json();
        const errorMsg = result.error || "Failed to delete user";
        toast.error(errorMsg);
      }
    } catch (error) {
      log.error("Error deleting user", error, { userId: userToDelete.id });
      const errorMsg = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMsg);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700";
      case UserRole.ADMIN:
        return "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700";
      case UserRole.STAFF:
        return "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700";
      case UserRole.VIEWER:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700";
      case UserRole.BRANCH_MANAGER:
        return "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700";
    }
  };

  const getRoleIconColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "text-purple-700 hover:bg-purple-100 hover:text-purple-700";
      case UserRole.ADMIN:
        return "text-blue-700 hover:bg-blue-100 hover:text-blue-700";
      case UserRole.BRANCH_MANAGER:
        return "text-orange-700 hover:bg-orange-100 hover:text-orange-700";
      case UserRole.STAFF:
        return "text-green-700 hover:bg-green-100 hover:text-green-700";
      case UserRole.VIEWER:
        return "text-pink-700 hover:bg-pink-100 hover:text-pink-700";
      default:
        return "text-gray-700 hover:bg-gray-100 hover:text-gray-700";
    }
  };

  const getRoleMenuItemClass = (role: UserRole, currentRole: UserRole) => {
    const isSelected = role === currentRole;
    const baseClass = "w-full justify-start text-sm";
    
    if (!isSelected) {
      return baseClass;
    }
    
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return `${baseClass} bg-purple-100 text-purple-700 hover:bg-purple-100 hover:text-purple-700`;
      case UserRole.ADMIN:
        return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700`;
      case UserRole.BRANCH_MANAGER:
        return `${baseClass} bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700`;
      case UserRole.STAFF:
        return `${baseClass} bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700`;
      case UserRole.VIEWER:
        return `${baseClass} bg-pink-100 text-pink-700 hover:bg-pink-100 hover:text-pink-700`;
      default:
        return baseClass;
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return "bg-green-100 text-green-700";
      case UserStatus.SUSPENDED:
        return "bg-red-100 text-red-700";
      case UserStatus.PENDING:
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Toolbar */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setCreateUserOpen(true)}
              className="h-12 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Display - Cards or Table */}
      {isLoading && users.length === 0 ? (
        variant === "table" ? (
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6">
              <TableSkeleton rows={5} columns={8} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-12 text-center text-gray-500">
            No users found. Create your first user to get started.
          </CardContent>
        </Card>
      ) : variant === "cards" ? (
        // Card Layout (for My Account Details page)
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllCards ? users : users.slice(0, 6)).map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profileImage || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* View Icon */}
                    {onViewUser && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewUser(user.id)}
                        className="h-8 w-8 hover:bg-gray-100 hover:text-gray-700"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {/* 3-dot Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100 hover:text-gray-700"
                          title="More Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setUserToEdit(user);
                            setEditSheetOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setPermissionsModalOpen(true);
                          }}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Manage Permissions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {user.username && (
                    <div>
                      <span className="text-gray-500">Username:</span>{" "}
                      <span className="text-gray-900 font-medium">{user.username}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="text-gray-900">{user.phone}</span>
                    </div>
                  )}
                  {user.businessName && (
                    <div>
                      <span className="text-gray-500">Business:</span>{" "}
                      <span className="text-gray-900">{user.businessName}</span>
                    </div>
                  )}
                  {user.branch && (
                    <div>
                      <span className="text-gray-500">Branch:</span>{" "}
                      <span className="text-gray-900">{user.branch}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace("_", " ")}
                    </Badge>
                    {user.status === UserStatus.SUSPENDED ? (
                      <Badge className="bg-red-100 text-red-700">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                          Suspended
                        </span>
                      </Badge>
                    ) : (
                      <Badge className={user.isVerified ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                        {user.isVerified ? (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-600"></span>
                            Pending
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-gray-500">
                      Registered: {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </div>
                    {user.lastLogin && (
                      <div className="text-gray-500">
                        Last login: {format(new Date(user.lastLogin), "MMM dd, yyyy")}
                      </div>
                    )}
                    <div className="text-gray-500">
                      Deliveries: {user.totalDeliveries}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
          {users.length > 6 && !showAllCards && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setShowAllCards(true)}
                className="h-9 rounded-full border border-[#dfe4f4] bg-white px-6 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
              >
                Show All
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Table Layout (for Users tab)
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-semibold text-gray-900">User</TableHead>
                    <TableHead className="font-semibold text-gray-900">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Joined</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImage || undefined} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">
                              {user.role.replace("_", " ").toLowerCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900">{user.phone || "—"}</span>
                      </TableCell>
                      <TableCell>
                        {user.status === UserStatus.SUSPENDED ? (
                          <Badge className="bg-red-100 text-red-700">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                              Suspended
                            </span>
                          </Badge>
                        ) : (
                          <Badge className={user.isVerified ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                            {user.isVerified ? (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-600"></span>
                                Pending
                              </span>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {/* Verify/Unverify Toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleVerification(user)}
                            className={`h-8 w-8 ${
                              user.isVerified 
                                ? "hover:bg-orange-100 hover:text-orange-700" 
                                : "hover:bg-green-100 hover:text-green-700"
                            }`}
                            title={user.isVerified ? "Unverify User" : "Verify User"}
                          >
                            {user.isVerified ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Account User */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/super-admin/users/${user.id}`)}
                            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                            title="View User Account"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          {/* Role Change */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${getRoleIconColor(user.role)}`}
                                title="Change Role"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2">
                              <div className="space-y-1">
                                <Button
                                  variant="ghost"
                                  className={getRoleMenuItemClass(UserRole.SUPER_ADMIN, user.role)}
                                  onClick={() => handleRoleChange(user, UserRole.SUPER_ADMIN)}
                                  disabled={user.role === UserRole.SUPER_ADMIN}
                                >
                                  Super Admin
                                </Button>
                                <Button
                                  variant="ghost"
                                  className={getRoleMenuItemClass(UserRole.ADMIN, user.role)}
                                  onClick={() => handleRoleChange(user, UserRole.ADMIN)}
                                  disabled={user.role === UserRole.ADMIN}
                                >
                                  Admin
                                </Button>
                                <Button
                                  variant="ghost"
                                  className={getRoleMenuItemClass(UserRole.STAFF, user.role)}
                                  onClick={() => handleRoleChange(user, UserRole.STAFF)}
                                  disabled={user.role === UserRole.STAFF}
                                >
                                  Staff
                                </Button>
                                <Button
                                  variant="ghost"
                                  className={getRoleMenuItemClass(UserRole.VIEWER, user.role)}
                                  onClick={() => handleRoleChange(user, UserRole.VIEWER)}
                                  disabled={user.role === UserRole.VIEWER}
                                >
                                  Viewer
                                </Button>
                                <Button
                                  variant="ghost"
                                  className={getRoleMenuItemClass(UserRole.BRANCH_MANAGER, user.role)}
                                  onClick={() => handleRoleChange(user, UserRole.BRANCH_MANAGER)}
                                  disabled={user.role === UserRole.BRANCH_MANAGER}
                                >
                                  Branch Manager
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          {/* Suspend/Activate */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleSuspend(user)}
                            className={`h-8 w-8 ${
                              user.status === UserStatus.SUSPENDED
                                ? "hover:bg-green-100 hover:text-green-700"
                                : "hover:bg-red-100 hover:text-red-700"
                            }`}
                            title={user.status === UserStatus.SUSPENDED ? "Activate User" : "Suspend User"}
                          >
                            {user.status === UserStatus.SUSPENDED ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUserToDelete(user);
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
            {variant === "table" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 py-4 text-sm text-slate-500 md:px-6">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span>{page}</span>
                    <span className="text-slate-400">of</span>
                    <span>{totalPages || 1}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page === 1 || isLoading}
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                  >
                    Previous
                  </Button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
                    {page}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage(page + 1)}
                    className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onSuccess={fetchUsers}
      />

      {/* Edit User Sheet */}
      {userToEdit && (
        <EditUserSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          user={userToEdit}
          onSuccess={fetchUsers}
        />
      )}

      {/* Manage Permissions Modal */}
      {selectedUser && (
        <ManagePermissionsModal
          open={permissionsModalOpen}
          onOpenChange={setPermissionsModalOpen}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}&apos;s account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 px-6 rounded-xl bg-[#1c5bff] text-white font-semibold hover:bg-[#1647c4] shadow-md shadow-[#1c5bff]/20">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

