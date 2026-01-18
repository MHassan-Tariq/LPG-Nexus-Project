export const dynamic = "force-dynamic";
export const revalidate = 0;

import { format } from "date-fns";

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
    <BackupClient 
      lastBackup={lastBackupDate} 
      lastBackupFileName={lastBackupFileName}
      lastRestore={lastRestoreDate} 
      lastRestoreFileName={lastRestoreFileName}
    />
  );
}
