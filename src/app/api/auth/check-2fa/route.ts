import { NextResponse } from "next/server";
import { z } from "zod";

import { checkUserRequires2FA } from "@/lib/data/two-factor";

const checkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const requestBody = (await request.json()) as unknown;
    const { email, password } = checkSchema.parse(requestBody);

    const result = await checkUserRequires2FA(email, password);

    return NextResponse.json(result);
  } catch (error) {
    console.error("2FA check error:", error);

    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
