import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../auth";

// GET /api/account/sessions - List current user's active sessions
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
      select: {
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        deviceType: true,
        browser: true,
        os: true,
        country: true,
        city: true,
        lastActivity: true,
        createdAt: true,
        expires: true,
      },
      orderBy: { lastActivity: "desc" },
    });

    // Determine current session
    const currentSessionToken = session.sessionToken;
    const sessionsWithCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.sessionToken === currentSessionToken,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/account/sessions - Revoke all other sessions (keep current)
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionToken = session.sessionToken;

    // Revoke all sessions except current
    const result = await prisma.session.updateMany({
      where: {
        userId: session.user.id,
        sessionToken: {
          not: currentSessionToken,
        },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: `Revoked ${result.count} sessions`,
      revokedCount: result.count,
    });
  } catch (error) {
    console.error("Error revoking sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
