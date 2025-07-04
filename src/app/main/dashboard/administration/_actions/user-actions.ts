"use server";

import bcryptjs from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "superuser"]),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  role: z.enum(["user", "superuser"]),
  isActive: z.boolean(),
});

// Helper function to check if user is superuser
async function requireSuperuser() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "superuser") {
    throw new Error("Forbidden - Superuser access required");
  }

  return session;
}

// Server action to get users with pagination
export async function getUsersAction(page = 1, limit = 10, search = "", role = "") {
  try {
    await requireSuperuser();

    const skip = (page - 1) * limit;

    // Build filter conditions
    interface WhereCondition {
      OR?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }[];
      role?: string;
    }

    const where: WhereCondition = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && ["user", "superuser"].includes(role)) {
      where.role = role;
    }

    // Get users with creator info
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

// Server action to create user
export async function createUserAction(formData: FormData) {
  try {
    const session = await requireSuperuser();

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
    };

    const validation = createUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      };
    }

    const { name, email, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        createdBy: session.user.id,
        lastModifiedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Revalidate the administration page
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User created successfully",
      user,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

// Server action to update user
export async function updateUserAction(userId: string, formData: FormData) {
  try {
    const session = await requireSuperuser();

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      isActive: formData.get("isActive") === "true",
    };

    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      };
    }

    const { name, email, role, isActive } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return {
          success: false,
          error: "Email already in use by another user",
        };
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        isActive,
        lastModifiedBy: session.user.id,
      },
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

    // Revalidate the administration page
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

// Server action to delete/deactivate user
export async function deleteUserAction(userId: string) {
  try {
    const session = await requireSuperuser();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return {
        success: false,
        error: "Cannot delete your own account",
      };
    }

    // Soft delete (deactivate) the user instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        lastModifiedBy: session.user.id,
      },
    });

    // Revalidate the administration page
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User deactivated successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

// Server action to reactivate user
export async function reactivateUserAction(userId: string) {
  try {
    const session = await requireSuperuser();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Reactivate the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        lastModifiedBy: session.user.id,
      },
    });

    // Revalidate the administration page
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User reactivated successfully",
    };
  } catch (error) {
    console.error("Error reactivating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate user",
    };
  }
}
