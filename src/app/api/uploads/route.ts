import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createUpload, getUserUploads } from "@/lib/data/uploads";

const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(["player", "conversion"]),
});

// GET /api/uploads - List user's upload history
export async function GET() {
  try {
    const { uploads } = await getUserUploads();
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Failed to fetch uploads:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
  }
}

// POST /api/uploads - Create new upload record
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const validatedData = uploadRequestSchema.parse(body);

    const upload = await createUpload(validatedData);

    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    console.error("Failed to create upload record:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create upload record" }, { status: 500 });
  }
}
