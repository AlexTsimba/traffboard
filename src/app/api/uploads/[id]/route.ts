import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/uploads/[id] - Get specific upload details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
    return NextResponse.json(
      { error: "Failed to fetch upload" },
      { status: 500 }
    );
  }
}

// PATCH /api/uploads/[id] - Update upload status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, recordCount, errorLog } = await request.json();

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "failed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
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
        ...(errorLog !== undefined && { errorLog }),
      },
    });

    return NextResponse.json({ upload: updatedUpload });
  } catch (error) {
    console.error("Failed to update upload:", error);
    return NextResponse.json(
      { error: "Failed to update upload" },
      { status: 500 }
    );
  }
}