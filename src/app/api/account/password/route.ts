import bcryptjs from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../auth";

// Validation schema for password change
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// POST /api/account/password - Change current user's password
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "User not found or invalid authentication method" }, { status: 404 });
    }

    // Verify current password
    const currentPasswordValid = await bcryptjs.compare(currentPassword, user.passwordHash);

    if (!currentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Check if new password is different from current
    const samePassword = await bcryptjs.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await bcryptjs.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newPasswordHash,
        lastModifiedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
