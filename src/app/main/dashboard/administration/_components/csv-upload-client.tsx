"use client";

import { CsvUpload } from "@/components/csv-upload";

export function CsvUploadClient() {
  return (
    <CsvUpload
      maxFiles={5}
      allowedTypes={["player", "conversion"]}
      onUploadComplete={(uploadId, count) => {
        console.log(`Upload ${uploadId} completed with ${count} records`);
      }}
      onError={(error) => {
        console.error("Upload error:", error);
      }}
    />
  );
}
