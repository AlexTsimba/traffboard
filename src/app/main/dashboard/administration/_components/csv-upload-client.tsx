"use client";

import { CsvUpload } from "@/components/csv-upload";

export function CsvUploadClient() {
  return (
    <CsvUpload
      maxFiles={5}
      allowedTypes={["player", "conversion"]}
      onUploadComplete={(uploadId, count) => {
        // Дополнительное уведомление об успехе (опционально)
        console.log(`Upload ${uploadId} completed with ${count} records`);
      }}
      onError={(error) => {
        // Логирование ошибок для отладки
        console.error("Upload error:", error);
      }}
    />
  );
}
