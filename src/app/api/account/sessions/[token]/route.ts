import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { revokeSession } from "@/lib/data/sessions";

// DELETE /api/account/sessions/[token] - Revoke specific session
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const sessionToken = token;

    await revokeSession(sessionToken);

    return NextResponse.json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking session:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Session not found or access denied") {
        return NextResponse.json({ error: "Session not found or already revoked" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
