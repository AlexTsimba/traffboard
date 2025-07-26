import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactor: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!targetUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: "User does not have 2FA enabled" },
        { status: 400 }
      );
    }

    // Disable 2FA for the user
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false }
    });

    // Remove 2FA secrets and backup codes
    if (targetUser.twoFactor) {
      await prisma.twoFactor.delete({
        where: { userId: userId }
      });
    }

    console.log(`Admin ${session.user.email} disabled 2FA for user ${targetUser.email}`);

    return NextResponse.json({
      message: "2FA disabled successfully",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        twoFactorEnabled: false
      }
    });

  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
}