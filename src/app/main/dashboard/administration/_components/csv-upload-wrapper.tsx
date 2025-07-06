"use client";

import { CsvUpload } from "@/components/csv-upload";

export function CsvUploadWrapper() {
  return <CsvUpload maxFiles={5} allowedTypes={["player", "conversion"]} />;
}
