"use client";

import { CsvUpload } from "@/components/csv-upload";
import { toastUtils } from "@/lib/toast-utils";

export function CsvUploadWrapper() {
  return (
    <CsvUpload
      maxFiles={5}
      allowedTypes={["player", "conversion"]}
      onUploadComplete={(uploadId, recordCount) => {
        if (recordCount > 0) {
          toastUtils.success("Upload completed successfully!", {
            description: `Processed ${recordCount} records.`,
          });
        } else {
          toastUtils.warning("Upload completed with warnings", {
            description: "No valid records were processed. Please check your file format.",
          });
        }
      }}
      onError={(error) => {
        toastUtils.error("Upload Error", {
          description: error,
        });
      }}
    />
  );
}
