import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type { DataProcessingResult } from "../data-transformers";
import { processPlayerDataCSV, processTrafficDataCSV } from "../data-transformers";

import { auditLog, requireAuth } from "./auth";
import { createConversionsFromImport } from "./conversions";
import { createPlayersFromImport } from "./players";
import { getUploadById, updateUploadStatus } from "./uploads";

export type ProcessingStatus = "processing" | "completed" | "failed";

/**
 * Process CSV file by upload ID with authentication and validation
 */
export async function processCSVByUploadId(uploadId: string): Promise<{
  success: boolean;
  processedCount?: number;
  errors?: string[];
  message: string;
}> {
  console.log("[CSV Processing] Starting for uploadId:", uploadId);
  const currentUser = await requireAuth();
  console.log("[CSV Processing] User authenticated:", currentUser.id);

  // Get upload record with ownership check
  const upload = await getUploadById(uploadId);
  console.log("[CSV Processing] Upload record:", upload);
  if (!upload) {
    throw new Error("Upload not found or access denied");
  }

  try {
    // Update status to processing
    console.log("[CSV Processing] Updating status to processing...");
    await updateUploadStatus(uploadId, "processing");

    // Read CSV file
    const filePath = path.join(process.cwd(), "public", "uploads", upload.fileName);
    console.log("[CSV Processing] Reading file from:", filePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const fileBuffer = await fs.readFile(filePath);
    const csvContent = fileBuffer.toString("utf8");
    console.log("[CSV Processing] File content length:", csvContent.length);
    console.log("[CSV Processing] File type:", upload.fileType);

    let result: DataProcessingResult<unknown>;
    let importResult: { count: number };

    // Process based on file type
    if (upload.fileType === "player") {
      result = processPlayerDataCSV(csvContent);
      importResult =
        result.data.length > 0
          ? await createPlayersFromImport(result.data as Parameters<typeof createPlayersFromImport>[0])
          : { count: 0 };
    } else {
      // Assume conversion data
      result = processTrafficDataCSV(csvContent);
      importResult =
        result.data.length > 0
          ? await createConversionsFromImport(result.data as Parameters<typeof createConversionsFromImport>[0])
          : { count: 0 };
    }

    // Update status based on results
    if (result.errors.length > 0) {
      await updateUploadStatus(uploadId, "failed", {
        recordCount: importResult.count,
        errorLog: result.errors.join("\n"),
      });

      void auditLog("csv.process_with_errors", currentUser.id, {
        uploadId,
        recordCount: importResult.count,
        errorCount: result.errors.length,
      });

      return {
        success: false,
        processedCount: importResult.count,
        errors: result.errors,
        message: "Processing completed with errors",
      };
    }

    await updateUploadStatus(uploadId, "completed", {
      recordCount: importResult.count,
    });

    void auditLog("csv.process_success", currentUser.id, {
      uploadId,
      recordCount: importResult.count,
    });

    return {
      success: true,
      processedCount: importResult.count,
      message: "File processed successfully",
    };
  } catch (error) {
    // Update status to failed
    await updateUploadStatus(uploadId, "failed", {
      errorLog: error instanceof Error ? error.message : "Unknown error occurred",
    });

    void auditLog("csv.process_failed", currentUser.id, {
      uploadId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

/**
 * Validate CSV content before processing
 */
export async function validateCSVContent(
  csvContent: string,
  fileType: "player" | "conversion",
): Promise<{
  isValid: boolean;
  errors: string[];
  previewData?: unknown[];
  estimatedRecords: number;
}> {
  await requireAuth();

  try {
    const result: DataProcessingResult<unknown> =
      fileType === "player" ? processPlayerDataCSV(csvContent) : processTrafficDataCSV(csvContent);

    return {
      isValid: result.errors.length === 0,
      errors: result.errors,
      previewData: result.data.slice(0, 5), // First 5 records for preview
      estimatedRecords: result.data.length,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Validation failed"],
      estimatedRecords: 0,
    };
  }
}

/**
 * Get CSV processing statistics
 */
export async function getCSVProcessingStats(): Promise<{
  totalProcessed: number;
  successfulProcesses: number;
  failedProcesses: number;
  totalRecordsImported: number;
}> {
  const currentUser = await requireAuth();

  // Note: This would ideally use dedicated audit/processing log tables
  // For now, we'll use basic counts from uploads table

  void auditLog("csv.stats_viewed", currentUser.id);

  // Return placeholder stats - in real implementation, would query processing logs
  return {
    totalProcessed: 0,
    successfulProcesses: 0,
    failedProcesses: 0,
    totalRecordsImported: 0,
  };
}
