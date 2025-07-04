import fs from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import type { DataProcessingResult } from "@/lib/data-transformers";
import { processPlayerDataCSV, processTrafficDataCSV } from "@/lib/data-transformers";
import { prisma } from "@/lib/prisma";

import { auth } from "../../../../auth";

const processCsvBodySchema = z.object({
  uploadId: z.string(),
});

type UploadStatus = "processing" | "completed" | "failed";

async function updateUploadStatus(
  uploadId: string,
  status: UploadStatus,
  details: {
    processedCount?: number;
    errorLog?: string[];
  } = {},
) {
  const { processedCount, errorLog } = details;
  await prisma.conversionUpload.update({
    where: { id: uploadId },
    data: {
      status,
      ...(processedCount !== undefined && { recordCount: processedCount }),
      ...(errorLog && { errorLog: errorLog.join("\n") }),
    },
  });
}

async function handleProcessingResult(uploadId: string, result: DataProcessingResult<unknown>) {
  if (result.errors.length > 0) {
    await updateUploadStatus(uploadId, "failed", {
      processedCount: result.processedCount,
      errorLog: result.errors,
    });
    return NextResponse.json(
      {
        message: "Processing completed with errors",
        processedCount: result.processedCount,
        errors: result.errors,
      },
      { status: 207 },
    );
  }

  await updateUploadStatus(uploadId, "completed", {
    processedCount: result.processedCount,
  });

  return NextResponse.json({
    message: "File processed successfully",
    processedCount: result.processedCount,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uploadId: string;
  try {
    const body = (await request.json()) as unknown;
    const { uploadId: id } = processCsvBodySchema.parse(body);
    uploadId = id;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const upload = await prisma.conversionUpload.findUnique({ where: { id: uploadId } });
  if (!upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  try {
    await updateUploadStatus(uploadId, "processing");

    const filePath = path.join(process.cwd(), "public", "uploads", upload.fileName);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const fileBuffer = await fs.readFile(filePath);
    const csvContent = fileBuffer.toString("utf8");

    if (upload.fileType === "player") {
      const result = processPlayerDataCSV(csvContent);
      if (result.data.length > 0) {
        await prisma.playerData.createMany({
          data: result.data,
          skipDuplicates: true,
        });
      }
      return await handleProcessingResult(uploadId, result);
    }

    const result = processTrafficDataCSV(csvContent);
    if (result.data.length > 0) {
      await prisma.trafficReport.createMany({
        data: result.data,
        skipDuplicates: true,
      });
    }
    return await handleProcessingResult(uploadId, result);
  } catch (error) {
    console.error(`[Process CSV Error] Upload ID: ${uploadId}`, error);
    await updateUploadStatus(uploadId, "failed", {
      errorLog: [error instanceof Error ? error.message : "An unknown error occurred"],
    });
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
