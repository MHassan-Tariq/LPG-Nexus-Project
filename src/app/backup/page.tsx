import { format } from "date-fns";

import { DashboardSidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardTopbarWrapper } from "@/components/dashboard/topbar-wrapper";
import { BackupClient } from "@/components/backup/backup-client";
import { getLastBackup, getLastRestore } from "./actions";
import { enforcePagePermission } from "@/lib/permission-check";

export default async function BackupPage() {
  // Check permissions before rendering
  await enforcePagePermission("/backup");
  const [lastBackup, lastRestore] = await Promise.all([getLastBackup(), getLastRestore()]);

  const lastBackupDate = lastBackup ? format(new Date(lastBackup.date), "MMM d, yyyy 'at' h:mm a") : "Never";
  const lastBackupFileName = lastBackup?.fileName || null;
  
  const lastRestoreDate = lastRestore ? format(new Date(lastRestore.date), "MMM d, yyyy 'at' h:mm a") : "Never";
  const lastRestoreFileName = lastRestore?.fileName || null;

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <DashboardSidebarWrapper />
      <div className="content-shell flex flex-1 flex-col">
        <DashboardTopbarWrapper />
        <main className="flex flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:px-8">
          <BackupClient 
            lastBackup={lastBackupDate} 
            lastBackupFileName={lastBackupFileName}
            lastRestore={lastRestoreDate} 
            lastRestoreFileName={lastRestoreFileName}
          />
        </main>
      </div>
    </div>
  );
}
