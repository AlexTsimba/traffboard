import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteUpload, getUploadById, updateUploadStatus } from "@/lib/data/uploads";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateUploadSchema = z.object({
  status: z.enum(["uploaded", "processing", "completed", "failed"]).optional(),
  recordCount: z.number().optional(),
  errorLog: z.string().optional(),
});

// GET /api/uploads/[id] - Get specific upload details
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const upload = await getUploadById(id);

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    return NextResponse.json({ upload });
  } catch (error) {
    console.error("Failed to fetch upload:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch upload" }, { status: 500 });
  }
}

// PATCH /api/uploads/[id] - Update upload status
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as unknown;
    const validatedData = updateUploadSchema.parse(body);

    if (validatedData.status) {
      await updateUploadStatus(id, validatedData.status, {
        recordCount: validatedData.recordCount,
        errorLog: validatedData.errorLog,
      });
    }

    const updatedUpload = await getUploadById(id);
    return NextResponse.json({ upload: updatedUpload });
  } catch (error) {
    console.error("Failed to update upload:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Upload not found or access denied") {
        return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update upload" }, { status: 500 });
  }
}

// DELETE /api/uploads/[id] - Delete upload
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteUpload(id);

    return NextResponse.json({ message: "Upload deleted successfully" });
  } catch (error) {
    console.error("Failed to delete upload:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Upload not found or access denied") {
        return NextResponse.json({ error: "Upload not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Failed to delete upload" }, { status: 500 });
  }
}
