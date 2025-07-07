import fs from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getUploadById, updateUploadStatus } from "@/lib/data/uploads";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: uploadId } = await params;
    console.log("[File Upload] Processing file upload for uploadId:", uploadId);

    // Verify upload exists and user has access
    const upload = await getUploadById(uploadId);
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    console.log("[File Upload] Upload record found:", upload.fileName);

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("[File Upload] File received:", file.name, "size:", file.size);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save file securely - use upload ID to avoid path traversal
    const secureFileName = `${uploadId}.csv`;
    const filePath = path.join(uploadsDir, secureFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[File Upload] Saving file to:", filePath);
    // ESLint disabled: filePath is constructed securely using upload ID to prevent path traversal
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.writeFile(filePath, buffer);

    // Update upload status
    await updateUploadStatus(uploadId, "uploaded");

    console.log("[File Upload] File uploaded successfully");

    return NextResponse.json({ success: true, fileName: upload.fileName });
  } catch (error) {
    console.error("[File Upload] Error:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "File upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
