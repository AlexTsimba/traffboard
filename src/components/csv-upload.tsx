"use client";

import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useCallback, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toastUtils } from "@/lib/toast-utils";

const getTypeColor = (type: "player" | "conversion"): string => {
  return type === "player" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
};

interface UploadFile {
  file: File;
  id: string;
  type: "player" | "conversion";
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  uploadId?: string;
  processedCount?: number;
}

interface CsvUploadProps {
  readonly onUploadComplete?: (uploadId: string, processedCount: number) => void;
  readonly onError?: (error: string) => void;
  readonly maxFiles?: number;
  readonly allowedTypes?: ("player" | "conversion")[];
}

export function CsvUpload({
  onUploadComplete,
  onError,
  maxFiles = 5,
  allowedTypes = ["player", "conversion"],
}: CsvUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = useCallback(() => crypto.randomUUID().slice(0, 15), []);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: "File size must be less than 10MB" };
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return { isValid: false, error: "Only CSV files are allowed" };
    }

    return { isValid: true };
  }, []);

  const detectFileType = useCallback((fileName: string): "player" | "conversion" => {
    const name = fileName.toLowerCase();
    if (name.includes("player") || name.includes("user") || name.includes("member") || name.includes("overall")) {
      return "player";
    }
    return "conversion";
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadFile[] = [];

      for (const file of fileList) {
        if (files.length + newFiles.length >= maxFiles) {
          toastUtils.csv.maxFilesExceeded(maxFiles);
          onError?.(`Maximum ${maxFiles} files allowed`);
          break;
        }

        const validation = validateFile(file);
        if (!validation.isValid) {
          if (validation.error?.includes("size")) {
            toastUtils.csv.fileTooBig(file.name, "10MB");
          } else if (validation.error?.includes("CSV")) {
            toastUtils.csv.invalidFormat(file.name);
          } else {
            toastUtils.error(validation.error ?? "Invalid file");
          }
          onError?.(validation.error ?? "Invalid file");
          continue;
        }

        const fileType = detectFileType(file.name);
        if (!allowedTypes.includes(fileType)) {
          toastUtils.error(`File type "${fileType}" not allowed for ${file.name}`);
          onError?.(`File type "${fileType}" not allowed`);
          continue;
        }

        newFiles.push({
          file,
          id: generateId(),
          type: fileType,
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, onError, validateFile, detectFileType, allowedTypes, generateId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      handleFiles(droppedFiles);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        handleFiles(selectedFiles);
      }
      // Reset input
      e.target.value = "";
    },
    [handleFiles],
  );

  // Helper function to update file status
  const updateFileStatus = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f)));
  }, []);

  // Helper function to create upload record
  const createUploadRecord = useCallback(async (file: File, type: string) => {
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        fileType: type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create upload record");
    }

    const { upload } = (await response.json()) as { upload: { id: string } };
    return upload.id;
  }, []);

  // Helper function to upload file physically
  const uploadFilePhysically = useCallback(async (uploadId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/uploads/${uploadId}/file`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
  }, []);

  // Helper function to process CSV
  const processCsvFile = useCallback(async (uploadId: string) => {
    const response = await fetch("/api/process-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ uploadId }),
    });

    const result = (await response.json()) as {
      message: string;
      processedCount?: number;
      errors?: string[];
    };

    if (!response.ok) {
      const errorMessage = result.message || "Processing failed";
      let errorDetails = "Technical error occurred";

      if (result.errors) {
        const firstThreeErrors = result.errors.slice(0, 3).join(", ");
        const remainingCount = result.errors.length - 3;
        const hasMoreErrors = remainingCount > 0;

        errorDetails = hasMoreErrors
          ? `Validation errors: ${firstThreeErrors} (and ${remainingCount} more)`
          : `Validation errors: ${firstThreeErrors}`;
      }

      throw new Error(`${errorMessage}. ${errorDetails}`);
    }

    return { response, result };
  }, []);

  // Helper function to categorize errors
  const getCategorizedError = useCallback((errorMessage: string) => {
    if (errorMessage.includes("Date is required")) {
      return "❌ File validation failed: Missing required date fields. Please check your CSV format.";
    } else if (errorMessage.includes("Authentication required")) {
      return "🔒 Session expired. Please refresh the page and try again.";
    } else if (errorMessage.includes("Unknown argument")) {
      return "⚙️ System error: Database constraint issue. Please contact support.";
    } else if (errorMessage.includes("validation errors")) {
      return `📋 ${errorMessage}`;
    }
    return errorMessage;
  }, []);

  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      const uploadToastId = toastUtils.csv.uploadStarted(uploadFile.file.name);

      try {
        // Start uploading
        updateFileStatus(uploadFile.id, { status: "uploading", progress: 10 });

        // Create upload record
        const uploadId = await createUploadRecord(uploadFile.file, uploadFile.type);
        updateFileStatus(uploadFile.id, { uploadId, progress: 30 });

        // Upload file physically
        await uploadFilePhysically(uploadId, uploadFile.file);
        updateFileStatus(uploadFile.id, { progress: 60 });

        // Wait for session stability
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Start processing
        updateFileStatus(uploadFile.id, { status: "processing", progress: 80 });
        toastUtils.update(uploadToastId, `⚙️ Processing CSV: ${uploadFile.file.name}`, "info");

        // Process CSV
        const { response: processResponse, result: processResult } = await processCsvFile(uploadId);

        // Handle partial success with validation errors
        if (processResponse.status === 207 && processResult.errors && processResult.errors.length > 0) {
          const partialMessage = `Processed ${processResult.processedCount ?? 0} records with ${processResult.errors.length} validation errors`;

          toastUtils.csv.validationErrors(
            uploadFile.file.name,
            processResult.errors.length,
            processResult.processedCount ?? 0,
          );

          updateFileStatus(uploadFile.id, {
            status: "completed",
            progress: 100,
            processedCount: processResult.processedCount,
            error: `${partialMessage}. Check logs for details.`,
          });

          onUploadComplete?.(uploadId, processResult.processedCount ?? 0);
          return;
        }

        // Complete success
        updateFileStatus(uploadFile.id, {
          status: "completed",
          progress: 100,
          processedCount: processResult.processedCount,
        });

        toastUtils.csv.uploadCompleted(uploadFile.file.name, processResult.processedCount ?? 0);
        onUploadComplete?.(uploadId, processResult.processedCount ?? 0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        const userFriendlyMessage = getCategorizedError(errorMessage);

        // Show error toast (prefer positive condition)
        if (errorMessage.includes("Authentication required")) {
          toastUtils.csv.sessionExpired();
        } else {
          toastUtils.csv.uploadFailed(uploadFile.file.name, userFriendlyMessage);
        }

        updateFileStatus(uploadFile.id, { status: "error", error: userFriendlyMessage });
        onError?.(userFriendlyMessage);
      }
    },
    [
      updateFileStatus,
      createUploadRecord,
      uploadFilePhysically,
      processCsvFile,
      getCategorizedError,
      onUploadComplete,
      onError,
    ],
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  }, [files, uploadFile]);

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed": {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      }
      case "error": {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
      case "pending":
      case "uploading":
      case "processing": {
        return <FileText className="text-muted-foreground h-4 w-4" />;
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="text-muted-foreground mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">Drop CSV files here</h3>
        <p className="text-muted-foreground">
          Or{" "}
          <Button variant="link" className="text-primary h-auto p-0" onClick={() => fileInputRef.current?.click()}>
            browse files
          </Button>
        </p>
        <p className="text-muted-foreground mt-2 text-sm">Supports player and conversion CSV files up to 10MB each</p>
        <input ref={fileInputRef} type="file" accept=".csv" multiple className="hidden" onChange={handleFileInput} />
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Files ({files.length})</h4>
            <Button
              size="sm"
              onClick={() => {
                void uploadAllFiles();
              }}
              disabled={!files.some((f) => f.status === "pending")}
            >
              Upload All
            </Button>
          </div>

          {files.map((uploadFile) => (
            <Card key={uploadFile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(uploadFile.status)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{uploadFile.file.name}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={getTypeColor(uploadFile.type)}>
                        {uploadFile.type}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {uploadFile.processedCount !== undefined && (
                        <span className="text-xs text-green-600">{uploadFile.processedCount} records</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeFile(uploadFile.id);
                  }}
                  disabled={uploadFile.status === "uploading" || uploadFile.status === "processing"}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              {(uploadFile.status === "uploading" || uploadFile.status === "processing") && (
                <div className="mt-3">
                  <Progress value={uploadFile.progress} className="h-2" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {uploadFile.status === "uploading" ? "Uploading..." : "Processing..."}
                  </p>
                </div>
              )}

              {/* Error */}
              {uploadFile.status === "error" && uploadFile.error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadFile.error}</AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
