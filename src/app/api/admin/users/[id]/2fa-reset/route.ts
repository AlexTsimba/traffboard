import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../../auth";

// Helper function to check if user is superuser
async function requireSuperuser() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "superuser") {
    return NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 });
  }

  return null;
}

// POST /api/admin/users/[id]/2fa-reset - Admin reset 2FA for a user
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireSuperuser();
    if (authError) return authError;

    const session = await auth();
    const { id } = await context.params;

    // Check if target user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        totpSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.totpSecret) {
      return NextResponse.json({ error: "User does not have 2FA enabled" }, { status: 400 });
    }

    // Prevent admin from resetting their own 2FA via this endpoint
    // (they should use the regular user flow)
    if (id === session?.user?.id) {
      return NextResponse.json(
        { error: "Cannot reset your own 2FA via admin endpoint. Use account settings instead." },
        { status: 400 },
      );
    }

    // Reset 2FA by removing the secret
    await prisma.user.update({
      where: { id },
      data: {
        totpSecret: null,
        lastModifiedBy: session?.user?.id,
      },
    });

    return NextResponse.json({
      message: `2FA has been reset for user ${user.name || user.email}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error resetting 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
