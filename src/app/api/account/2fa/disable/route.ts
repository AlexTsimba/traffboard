import bcryptjs from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().min(6, "TOTP code must be 6 digits").max(6),
});

// POST /api/account/2fa/disable - Disable 2FA with password and TOTP verification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = disable2FASchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const { password, code } = validation.data;

    // Get user with password hash and TOTP secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        totpSecret: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "User not found or invalid authentication method" }, { status: 404 });
    }

    if (!user.totpSecret) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    // Verify password
    const passwordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Verify TOTP code
    const codeValid = authenticator.verify({
      token: code,
      secret: user.totpSecret,
    });

    if (!codeValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Disable 2FA by removing the secret
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: null,
        lastModifiedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
