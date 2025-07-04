import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../auth";

interface RouteContext {
  params: { id: string };
}

// Define a type for the PATCH request body
interface UpdateUploadRequestBody {
  status?: "pending" | "processing" | "completed" | "failed";
  recordCount?: number;
  errorLog?: string[];
}

// GET /api/uploads/[id] - Get specific upload details
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const upload = await prisma.conversionUpload.findFirst({
      where: {
        id,
        uploadedBy: session.user.id, // Ensure user can only see their own uploads
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    return NextResponse.json({ upload });
  } catch (error) {
    console.error("Failed to fetch upload:", error);
    return NextResponse.json({ error: "Failed to fetch upload" }, { status: 500 });
  }
}

// PATCH /api/uploads/[id] - Update upload status
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    // Explicitly type the request body
    const { status, recordCount, errorLog } = (await request.json()) as UpdateUploadRequestBody;

    // Validate status
    if (status && !["pending", "processing", "completed", "failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const upload = await prisma.conversionUpload.findFirst({
      where: {
        id,
        uploadedBy: session.user.id,
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const updatedUpload = await prisma.conversionUpload.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(recordCount !== undefined && { recordCount }),
        ...(errorLog !== undefined && { errorLog: errorLog.join("\n") }),
      },
    });

    return NextResponse.json({ upload: updatedUpload });
  } catch (error) {
    console.error("Failed to update upload:", error);
    return NextResponse.json({ error: "Failed to update upload" }, { status: 500 });
  }
}
