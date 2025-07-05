"use client";

import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useCallback, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const getTypeColor = (type: "player" | "traffic"): string => {
  return type === "player" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
};

interface UploadFile {
  file: File;
  id: string;
  type: "player" | "traffic";
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
  readonly allowedTypes?: ("player" | "traffic")[];
}

export function CsvUpload({
  onUploadComplete,
  onError,
  maxFiles = 5,
  allowedTypes = ["player", "traffic"],
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

  const detectFileType = useCallback((fileName: string): "player" | "traffic" => {
    const name = fileName.toLowerCase();
    if (name.includes("player") || name.includes("user") || name.includes("member")) {
      return "player";
    }
    return "traffic";
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadFile[] = [];

      for (const file of fileList) {
        if (files.length + newFiles.length >= maxFiles) {
          onError?.(`Maximum ${maxFiles} files allowed`);
          break;
        }

        const validation = validateFile(file);
        if (!validation.isValid) {
          onError?.(validation.error ?? "Invalid file");
          continue;
        }

        const fileType = detectFileType(file.name);
        if (!allowedTypes.includes(fileType)) {
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

  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      try {
        // Update status to uploading
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress: 10 } : f)));

        // Create upload record
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: uploadFile.file.name,
            fileType: uploadFile.type,
            uploadPath: `/uploads/${uploadFile.file.name}`,
            uploadSize: uploadFile.file.size,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to create upload record");
        }

        const { upload } = (await uploadResponse.json()) as { upload: { id: string } };

        // Update progress
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, uploadId: upload.id, progress: 50 } : f)));

        // Simulate file upload (in real implementation, upload to storage)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update to processing
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "processing", progress: 70 } : f)),
        );

        // Process CSV
        const processResponse = await fetch("/api/process-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: upload.id }),
        });

        const processResult = (await processResponse.json()) as {
          message: string;
          processedCount?: number;
          errors?: string[];
        };

        if (!processResponse.ok) {
          throw new Error(processResult.message || "Processing failed");
        }

        // Update to completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  processedCount: processResult.processedCount,
                }
              : f,
          ),
        );

        onUploadComplete?.(upload.id, processResult.processedCount ?? 0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error", error: errorMessage } : f)),
        );

        onError?.(errorMessage);
      }
    },
    [onUploadComplete, onError],
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
