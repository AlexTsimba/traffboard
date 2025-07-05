import { NextResponse } from "next/server";

import { getUserSessions, revokeAllOtherSessions } from "@/lib/data/sessions";

// GET /api/account/sessions - List current user's active sessions
export async function GET() {
  try {
    const { sessions } = await getUserSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/account/sessions - Revoke all other sessions (keep current)
export async function DELETE() {
  try {
    const { revokedCount } = await revokeAllOtherSessions();

    return NextResponse.json({
      message: `Revoked ${revokedCount} sessions`,
      revokedCount,
    });
  } catch (error) {
    console.error("Error revoking sessions:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
