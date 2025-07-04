import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { processPlayerDataCSV, processTrafficDataCSV } from "@/lib/data-transformers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { csvContent, fileType, uploadId } = await request.json();

    // Validate input
    if (!csvContent || !fileType || !uploadId) {
      return NextResponse.json(
        { error: "Missing required fields: csvContent, fileType, uploadId" },
        { status: 400 }
      );
    }

    if (!["players", "traffic"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'players' or 'traffic'" },
        { status: 400 }
      );
    }

    // Verify upload record exists and belongs to user
    const upload = await prisma.conversionUpload.findFirst({
      where: {
        id: uploadId,
        uploadedBy: session.user.id,
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload record not found" }, { status: 404 });
    }

    // Update upload status to processing
    await prisma.conversionUpload.update({
      where: { id: uploadId },
      data: { status: "processing" },
    });

    let result;
    let insertCount = 0;

    try {
      if (fileType === "players") {
        result = processPlayerDataCSV(csvContent);
        
        if (result.success && result.data.length > 0) {
          // Batch insert player data (1000 records at a time)
          const batchSize = 1000;
          for (let i = 0; i < result.data.length; i += batchSize) {
            const batch = result.data.slice(i, i + batchSize);
            const insertResult = await prisma.playerData.createMany({
              data: batch,
              skipDuplicates: true,
            });
            insertCount += insertResult.count;
          }
        }
      } else {
        result = processTrafficDataCSV(csvContent);
        
        if (result.success && result.data.length > 0) {
          // Batch insert traffic data (1000 records at a time)
          const batchSize = 1000;
          for (let i = 0; i < result.data.length; i += batchSize) {
            const batch = result.data.slice(i, i + batchSize);
            const insertResult = await prisma.trafficReport.createMany({
              data: batch,
              skipDuplicates: true,
            });
            insertCount += insertResult.count;
          }
        }
      }

      // Update upload record with results
      const finalStatus = result.success ? "completed" : "failed";
      const errorLog = result.errors.length > 0 ? result.errors.join("\n") : null;

      await prisma.conversionUpload.update({
        where: { id: uploadId },
        data: {
          status: finalStatus,
          recordCount: insertCount,
          errorLog,
        },
      });

      return NextResponse.json({
        success: result.success,
        processedCount: result.processedCount,
        insertedCount: insertCount,
        errorCount: result.errorCount,
        errors: result.errors,
        uploadId,
      });

    } catch (processingError) {
      // Update upload status to failed
      await prisma.conversionUpload.update({
        where: { id: uploadId },
        data: {
          status: "failed",
          errorLog: processingError instanceof Error ? processingError.message : String(processingError),
        },
      });

      throw processingError;
    }

  } catch (error) {
    console.error("CSV processing failed:", error);
    return NextResponse.json(
      { error: "Failed to process CSV data" },
      { status: 500 }
    );
  }
}