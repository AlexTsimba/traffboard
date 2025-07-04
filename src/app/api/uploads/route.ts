import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

// GET /api/uploads - List user's upload history
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploads = await prisma.conversionUpload.findMany({
      where: { uploadedBy: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 uploads
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Failed to fetch uploads:", error);
    return NextResponse.json(
      { error: "Failed to fetch uploads" },
      { status: 500 }
    );
  }
}

// POST /api/uploads - Create new upload record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType } = await request.json();

    // Validate fileType
    if (!["players", "traffic"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'players' or 'traffic'" },
        { status: 400 }
      );
    }

    const upload = await prisma.conversionUpload.create({
      data: {
        fileName,
        fileType,
        uploadedBy: session.user.id,
        status: "pending",
      },
    });

    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    console.error("Failed to create upload record:", error);
    return NextResponse.json(
      { error: "Failed to create upload record" },
      { status: 500 }
    );
  }
}