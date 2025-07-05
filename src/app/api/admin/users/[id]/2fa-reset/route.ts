import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { admin2FAReset } from "@/lib/data/two-factor";

// Helper to handle error responses
function handleError(error: unknown): NextResponse {
  if (!(error instanceof Error)) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const errorMap = {
    "Authentication required": { message: "Unauthorized", status: 401 },
    "Admin access required": { message: "Forbidden - Superuser access required", status: 403 },
    "User not found": { message: "User not found", status: 404 },
    "User does not have 2FA enabled": { message: "User does not have 2FA enabled", status: 400 },
    "Cannot reset your own 2FA via admin endpoint. Use account settings instead.": {
      message: "Cannot reset your own 2FA via admin endpoint. Use account settings instead.",
      status: 400,
    },
  } as const;

  if (error.message in errorMap) {
    const errorInfo = errorMap[error.message as keyof typeof errorMap];
    return NextResponse.json({ error: errorInfo.message }, { status: errorInfo.status });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// POST /api/admin/users/[id]/2fa-reset - Admin reset 2FA for a user
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await admin2FAReset(id);

    const userName: string = result.userName ?? result.userEmail;

    return NextResponse.json({
      message: `2FA has been reset for user ${userName}`,
      user: {
        id: result.userId,
        name: result.userName,
        email: result.userEmail,
      },
    });
  } catch (error) {
    console.error("Error resetting 2FA:", error);
    return handleError(error);
  }
}
