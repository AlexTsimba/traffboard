import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { processCSVByUploadId } from "@/lib/data/csv-processing";

const processCsvBodySchema = z.object({
  uploadId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const { uploadId } = processCsvBodySchema.parse(body);

    const result = await processCSVByUploadId(uploadId);

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
    console.error("Process CSV Error:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Upload not found or access denied") {
        return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
