"use client";

import { useState } from "react";

import { CsvUpload } from "@/components/csv-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const handleUploadError = (error: string) => {
  console.error("Upload error:", error);
  // Show error message to user
  alert(`Upload failed: ${error}`);
};

export default function ConversionsPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleUploadComplete = (uploadId: string, processedCount: number) => {
    console.log(`Upload ${uploadId} completed with ${processedCount} records`);
    setIsUploadDialogOpen(false);
    // Refresh conversion data after successful upload
    globalThis.location.reload();
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Conversions</h1>
        <p className="text-muted-foreground">Detailed conversion tracking and analysis</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Conversion Data</h2>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Upload CSV</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload CSV Files</DialogTitle>
              </DialogHeader>
              <CsvUpload
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
                maxFiles={3}
                allowedTypes={["conversion"]}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline">Export Data</Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Conversion Table</h3>
          <div className="text-muted-foreground py-12 text-center">
            <p className="text-lg">No conversion data available</p>
            <p className="text-sm">Upload a CSV file to start tracking conversions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
