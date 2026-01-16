"use client";

import { useState, useTransition } from "react";
import { Database, Download, Check, Upload, AlertTriangle, FileUp, RotateCcw } from "lucide-react";

import { restoreBackup } from "@/app/backup/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface BackupClientProps {
  lastBackup: string;
  lastBackupFileName: string | null;
  lastRestore: string;
  lastRestoreFileName: string | null;
}

export function BackupClient({ lastBackup, lastBackupFileName, lastRestore, lastRestoreFileName }: BackupClientProps) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isRestoring, startRestoring] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  function handleGenerateBackup() {
    setBackupError(null);
    startGenerating(async () => {
      try {
        // Use API route for better handling of large files
        const response = await fetch("/api/backup/generate");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to generate backup" }));
          setBackupError(errorData.error || "Failed to generate backup. Please try again.");
          return;
        }

        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get("Content-Disposition");
        let fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.json`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }

        // Get the blob and download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Refresh the page to update last backup time
        router.refresh();
      } catch (error) {
        console.error("Backup error:", error);
        setBackupError(error instanceof Error ? error.message : "An unexpected error occurred during backup.");
      }
    });
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file);
        setRestoreError(null);
      } else {
        setRestoreError("Please select a valid JSON backup file");
        setSelectedFile(null);
      }
    }
  }

  function handleRestoreBackup() {
    if (!selectedFile) {
      setRestoreError("Please select a backup file first");
      return;
    }

    startRestoring(async () => {
      try {
        const text = await selectedFile.text();
        const result = await restoreBackup(text, selectedFile.name);
        
        if (result.success) {
          // Reload the page after successful restore
          window.location.reload();
        } else {
          setRestoreError(result.error || "Failed to restore backup");
        }
      } catch (error) {
        setRestoreError(error instanceof Error ? error.message : "Failed to read backup file");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Generate Backup Section */}
      <div className="rounded-[32px] border border-[#edf0f7] bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[#e1efff] p-3 text-[#1d4ed8]">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Generate Backup</h2>
            <p className="text-sm text-slate-500">Create a backup of your entire database.</p>
          </div>
        </div>

        <div className="mb-6 rounded-[20px] border border-[#e1e6f5] bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">What will be backed up?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Customer records and information</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Cylinder delivery and inventory records</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Payment logs and billing information</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Expense records and transactions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Notes and daily entries</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">System settings and preferences</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">User accounts and authentication data</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-semibold">Note:</span> The backup file will be downloaded to your local computer drive
            in JSON format. Please store it in a safe location.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleGenerateBackup}
          disabled={isGenerating}
          className="mb-6 h-12 w-full rounded-[18px] bg-[#1c5bff] text-base font-semibold text-white hover:bg-[#1647c4] disabled:opacity-60"
        >
          <Download className="mr-2 h-5 w-5" />
          {isGenerating ? "Generating Backup..." : "Generate Backup"}
        </Button>
        {backupError && (
          <div className="mb-6 rounded-[16px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Error: {backupError}</p>
          </div>
        )}

        <div className="rounded-[20px] border border-[#e1e6f5] bg-[#f8f9ff] p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Best Practices</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Create regular backups (daily or weekly)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Store backups in multiple locations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Test your backups periodically to ensure data integrity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-slate-400">•</span>
              <span>Keep backups for at least 90 days</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Last backup: {lastBackup}</p>
          {lastBackupFileName && (
            <p className="mt-1 font-medium text-slate-700">File: {lastBackupFileName}</p>
          )}
          <p className="mt-1">
            {lastBackup === "Never" ? "Recommended: Create your first backup now" : "Your data is backed up"}
          </p>
        </div>
      </div>

      {/* Restore Backup Section */}
      <div className="rounded-[32px] border border-[#edf0f7] bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[#d1fae5] p-3 text-[#059669]">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Restore Backup</h2>
            <p className="text-sm text-slate-500">Upload and restore your database from a backup file.</p>
          </div>
        </div>

        <div className="mb-6 rounded-[20px] border border-[#e1e6f5] bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">What will be restored?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">All customer records and information</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Complete cylinder inventory and delivery history</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">All payment logs and billing data</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Expense records and transactions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">Notes and daily journal entries</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#12b76a]">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-slate-700">System settings and customizations</span>
            </div>
          </div>

          <div className="mt-6 rounded-[16px] border border-[#fef3c7] bg-[#fffbeb] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b]">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#b45309]">
                  Warning: Restoring a backup will replace all current data. Please ensure you have a recent backup
                  before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <input
              type="file"
              id="backup-file-input"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => document.getElementById("backup-file-input")?.click()}
              variant="outline"
              className="h-12 w-full rounded-[18px] border-2 border-[#e1e6f5] bg-white text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileUp className="mr-2 h-5 w-5" />
              Select Backup File
            </Button>
            {selectedFile && (
              <p className="mt-2 text-sm text-slate-600">Selected: {selectedFile.name}</p>
            )}
            {restoreError && (
              <p className="mt-2 text-sm text-red-600">{restoreError}</p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleRestoreBackup}
            disabled={isRestoring || !selectedFile}
            className="h-12 w-full rounded-[18px] bg-[#10b981] text-base font-semibold text-white hover:bg-[#059669] disabled:opacity-60"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            {isRestoring ? "Restoring Backup..." : "Restore Backup"}
          </Button>
        </div>

        <div className="rounded-[20px] border border-[#fee2e2] bg-[#fef2f2] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#b91c1c]">Important Notes</h3>
          <ul className="space-y-2 text-sm text-[#b91c1c]">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Ensure the backup file is from a trusted source</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Only use backup files generated by this system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>The page will reload automatically after restoration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>Create a backup of current data before restoring</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Last restore: {lastRestore}</p>
          {lastRestoreFileName && (
            <p className="mt-1 font-medium text-slate-700">File: {lastRestoreFileName}</p>
          )}
          <p className="mt-1">
            {lastRestore === "Never" ? "No backups have been restored yet" : "Last restored successfully"}
          </p>
        </div>
      </div>
    </div>
  );
}
