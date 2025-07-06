import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { processCSVByUploadId } from "@/lib/data/csv-processing";

export async function POST(request: NextRequest) {
  try {
    console.log("[Debug CSV] Processing request...");
    const body = (await request.json()) as { uploadId: string };
    console.log("[Debug CSV] Upload ID:", body.uploadId);

    const result = await processCSVByUploadId(body.uploadId);
    console.log("[Debug CSV] Result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Debug CSV] Error:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
