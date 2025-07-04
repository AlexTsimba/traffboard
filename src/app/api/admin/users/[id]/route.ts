import bcryptjs from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "superuser"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

// Helper function to check if user is superuser
async function requireSuperuser() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role !== "superuser") {
    return { error: NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 }) };
  }

  return { session };
}

// GET /api/admin/users/[id] - Get specific user details
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireSuperuser();
    if ("error" in authResult) return authResult.error;

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        lastModifiedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            uploads: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireSuperuser();
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await context.params;
    const body = (await request.json()) as unknown;

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const updates = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent editing the last superuser's role
    if (updates.role && existingUser.role === "superuser" && updates.role !== "superuser") {
      const superuserCount = await prisma.user.count({
        where: { role: "superuser", isActive: true },
      });

      if (superuserCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove superuser role from the last active superuser" },
          { status: 400 },
        );
      }
    }

    // Check email uniqueness if email is being updated
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updates.email },
      });

      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    // Prepare update data
    interface UpdateData {
      name?: string;
      email?: string;
      role?: "user" | "superuser";
      isActive?: boolean;
      passwordHash?: string;
      lastModifiedBy?: string;
    }

    const updateData: UpdateData = {
      ...updates,
      lastModifiedBy: session.user.id,
    };

    // Hash password if provided
    if (updates.password) {
      const passwordHash = await bcryptjs.hash(updates.password, 12);
      const updatesWithoutPassword = { ...updates };
      delete updatesWithoutPassword.password;
      Object.assign(updateData, updatesWithoutPassword, { passwordHash, lastModifiedBy: session.user.id });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        lastModifiedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireSuperuser();
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await context.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Prevent deleting the last superuser
    if (existingUser.role === "superuser" && existingUser.isActive) {
      const activeSuperuserCount = await prisma.user.count({
        where: { role: "superuser", isActive: true },
      });

      if (activeSuperuserCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last active superuser" }, { status: 400 });
      }
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        lastModifiedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
