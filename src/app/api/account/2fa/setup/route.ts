import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

// GET /api/account/2fa/setup - Generate TOTP secret and QR code for 2FA setup
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true },
    });

    if (user?.totpSecret) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    // Generate new TOTP secret
    const secret = authenticator.generateSecret();

    // Create service name and account name for QR code
    const serviceName = "TraffBoard";
    const accountName = session.user.email || session.user.id;

    // Generate TOTP URL
    const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      serviceName,
      accountName,
    });
  } catch (error) {
    console.error("Error generating 2FA setup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/account/2fa/setup - Verify TOTP code and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { secret?: string; code?: string };
    const { secret, code } = body;

    if (!secret || !code) {
      return NextResponse.json({ error: "Secret and verification code are required" }, { status: 400 });
    }

    // Verify the TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Check if user already has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true },
    });

    if (user?.totpSecret) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    // Save the secret to enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totpSecret: secret,
        lastModifiedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
