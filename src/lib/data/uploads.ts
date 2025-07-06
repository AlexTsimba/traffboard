import "server-only";

import { prisma } from "../prisma";

import { auditLog, requireAuth, type AuthenticatedUser } from "./auth";

/**
 * Safe upload data for client exposure
 */
export interface SafeUpload {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  recordCount: number | null;
  errorLog: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUploadData {
  fileName: string;
  fileType: string;
}

/**
 * Get all uploads for current user
 */
export async function getUserUploads(): Promise<{
  uploads: SafeUpload[];
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const uploads = await prisma.conversionUpload.findMany({
    where: { uploadedBy: currentUser.id },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      status: true,
      recordCount: true,
      errorLog: true,
      uploadedBy: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  await auditLog("uploads.list", currentUser.id);

  return { uploads, currentUser };
}

/**
 * Get upload by ID with ownership check
 */
export async function getUploadById(uploadId: string): Promise<SafeUpload | null> {
  const currentUser = await requireAuth();

  const upload = await prisma.conversionUpload.findFirst({
    where: {
      id: uploadId,
      uploadedBy: currentUser.id,
    },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      status: true,
      recordCount: true,
      errorLog: true,
      uploadedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await auditLog("uploads.view", currentUser.id, { uploadId });

  return upload;
}

/**
 * Create new upload record
 */
export async function createUpload(uploadData: CreateUploadData): Promise<SafeUpload> {
  const currentUser = await requireAuth();

  const upload = await prisma.conversionUpload.create({
    data: {
      ...uploadData,
      uploadedBy: currentUser.id,
      status: "pending",
    },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      status: true,
      recordCount: true,
      errorLog: true,
      uploadedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await auditLog("uploads.create", currentUser.id, {
    uploadId: upload.id,
    fileName: uploadData.fileName,
    fileType: uploadData.fileType,
  });

  return upload;
}

/**
 * Update upload status and metadata
 */
export async function updateUploadStatus(
  uploadId: string,
  status: string,
  metadata?: { recordCount?: number; errorLog?: string },
): Promise<void> {
  const currentUser = await requireAuth();

  await prisma.conversionUpload.update({
    where: {
      id: uploadId,
      uploadedBy: currentUser.id,
    },
    data: {
      status,
      ...metadata,
    },
  });

  await auditLog("uploads.update_status", currentUser.id, {
    uploadId,
    status,
    metadata,
  });
}

/**
 * Delete upload by ID with ownership check
 */
export async function deleteUpload(uploadId: string): Promise<void> {
  const currentUser = await requireAuth();

  const upload = await prisma.conversionUpload.findFirst({
    where: {
      id: uploadId,
      uploadedBy: currentUser.id,
    },
  });

  if (!upload) {
    throw new Error("Upload not found or access denied");
  }

  await prisma.conversionUpload.delete({
    where: { id: uploadId },
  });

  await auditLog("uploads.delete", currentUser.id, {
    uploadId,
    fileName: upload.fileName,
  });
}

/**
 * Get upload statistics for current user
 */
export async function getUserUploadStats(): Promise<{
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalRecordsProcessed: number;
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const [totalStats, recordStats] = await Promise.all([
    prisma.conversionUpload.groupBy({
      by: ["status"],
      where: { uploadedBy: currentUser.id },
      _count: { status: true },
    }),
    prisma.conversionUpload.aggregate({
      where: {
        uploadedBy: currentUser.id,
        status: "completed",
      },
      _sum: { recordCount: true },
    }),
  ]);

  const totalUploads = totalStats.reduce((sum, item) => sum + item._count.status, 0);
  const successfulUploads = totalStats.find((item) => item.status === "completed")?._count.status ?? 0;
  const failedUploads = totalStats.find((item) => item.status === "failed")?._count.status ?? 0;

  await auditLog("uploads.stats", currentUser.id);

  return {
    totalUploads,
    successfulUploads,
    failedUploads,
    totalRecordsProcessed: recordStats._sum.recordCount ?? 0,
    currentUser,
  };
}
