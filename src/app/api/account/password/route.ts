import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { updateUserPassword } from "@/lib/data/users";

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
    const body = (await request.json()) as unknown;
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    await updateUserPassword(currentPassword, newPassword);

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Current password is incorrect") {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if (error.message === "User not found") {
        return NextResponse.json({ error: "User not found or invalid authentication method" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
