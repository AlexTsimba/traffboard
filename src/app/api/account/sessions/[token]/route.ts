import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

// DELETE /api/account/sessions/[token] - Revoke specific session
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const sessionToken = token;

    // Note: With JWT strategy, we can't easily get the current session token
    // This is a limitation of JWT-based sessions vs database sessions

    // Find and revoke the session
    const targetSession = await prisma.session.findFirst({
      where: {
        sessionToken,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!targetSession) {
      return NextResponse.json({ error: "Session not found or already revoked" }, { status: 404 });
    }

    // Revoke the session
    await prisma.session.update({
      where: { sessionToken },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
