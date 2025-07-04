import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../auth";

// Define a type for the POST request body
interface UploadRequestBody {
  fileName: string;
  fileType: string;
}

// GET /api/uploads - List user's upload history
export async function GET(_req: NextRequest) {
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
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
  }
}

// POST /api/uploads - Create new upload record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Explicitly type the request body
    const { fileName, fileType } = (await request.json()) as UploadRequestBody;

    // Validate fileType
    if (!["players", "traffic"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type. Must be 'players' or 'traffic'" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to create upload record" }, { status: 500 });
  }
}
