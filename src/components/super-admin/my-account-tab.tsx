"use client";

import { SuperAdminInfoCard } from "./superadmin-info-card";
import { UserManagementPanel } from "./user-management-panel";

interface MyAccountTabProps {
  selectedUserId?: string | null;
  onViewUser?: (userId: string) => void;
}

export function MyAccountTab({ selectedUserId, onViewUser }: MyAccountTabProps) {
  return (
    <div className="space-y-6">
      <SuperAdminInfoCard selectedUserId={selectedUserId || null} />
      <UserManagementPanel onViewUser={onViewUser} variant="cards" />
    </div>
  );
}

