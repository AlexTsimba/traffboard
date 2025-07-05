import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { deactivateUser, getUserByIdAdmin, updateUserAdmin } from "@/lib/data/users";

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "superuser"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// Helper to handle common auth errors
function handleError(error: unknown): NextResponse {
  if (!(error instanceof Error)) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const errorMap = {
    "Authentication required": { message: "Unauthorized", status: 401 },
    "Admin access required": { message: "Forbidden - Superuser access required", status: 403 },
    "Email already exists": { message: "Email already exists", status: 409 },
    "Cannot remove superuser role from the last active superuser": {
      message: "Cannot remove superuser role from the last active superuser",
      status: 400,
    },
    "Cannot delete own account": { message: "Cannot delete your own account", status: 400 },
    "User not found": { message: "User not found", status: 404 },
    "Cannot delete the last active superuser": {
      message: "Cannot delete the last active superuser",
      status: 400,
    },
  } as const;

  if (error.message in errorMap) {
    const errorInfo = errorMap[error.message as keyof typeof errorMap];
    return NextResponse.json({ error: errorInfo.message }, { status: errorInfo.status });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// GET /api/admin/users/[id] - Get specific user details
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getUserByIdAdmin(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return handleError(error);
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as unknown;

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const user = await updateUserAdmin(id, validation.data);
    return NextResponse.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    return handleError(error);
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deactivateUser(id);
    return NextResponse.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return handleError(error);
  }
}
