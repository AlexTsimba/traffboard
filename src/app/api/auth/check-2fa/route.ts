import bcryptjs from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const checkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const requestBody = (await request.json()) as unknown;
    const { email, password } = checkSchema.parse(requestBody);

    // Find user and check password
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        totpSecret: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordsMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if 2FA is enabled
    const requires2FA = !!user.totpSecret;

    return NextResponse.json({
      requires2FA,
      userId: user.id,
    });
  } catch (error) {
    console.error("2FA check error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
