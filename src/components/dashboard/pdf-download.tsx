"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-retry";
import { log } from "@/lib/logger";

export function PdfDownloadCard() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDownload() {
    setIsLoading(true);
    setStatus(null);
    try {
      const response = await apiFetch("/api/reports/pdf");
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cylinder-dashboard.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      log.info("PDF report downloaded successfully");
      setStatus("Report generated successfully.");
    } catch (error) {
      log.error("Failed to download PDF report", error);
      setStatus("Unable to download report.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Export Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generate an audit-ready PDF of the latest stock and movement metrics.
        </p>
        <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
          <FileDown className="h-4 w-4" />
          {isLoading ? "Preparing..." : "Download PDF"}
        </Button>
        {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}

