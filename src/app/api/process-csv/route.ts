import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { processCSVByUploadId } from "@/lib/data/csv-processing";

const processCsvBodySchema = z.object({
  uploadId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    console.log("[CSV API] Processing request...");
    const body = (await request.json()) as unknown;
    console.log("[CSV API] Request body:", body);

    const { uploadId } = processCsvBodySchema.parse(body);
    console.log("[CSV API] Validated uploadId:", uploadId);

    console.log("[CSV API] Starting CSV processing...");
    const result = await processCSVByUploadId(uploadId);
    console.log("[CSV API] Processing result:", result);

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.message,
          processedCount: result.processedCount,
          errors: result.errors,
        },
        { status: 207 }, // 207 Multi-Status for partial success
      );
    }

    return NextResponse.json({
      message: result.message,
      processedCount: result.processedCount,
    });
  } catch (error) {
    console.error("[CSV API] Process CSV Error:", error);
    console.error("[CSV API] Error stack:", error instanceof Error ? error.stack : "No stack");

    if (error instanceof Error) {
      console.log("[CSV API] Error message:", error.message);
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Upload not found or access denied") {
        return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
