"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createUser, deleteUser, getUsers, updateUser } from "@/lib/data/users";

// Input validation schemas using Zod
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"], { message: "Role must be either user or admin" }),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  role: z.enum(["user", "admin"], { message: "Role must be either user or admin" }),
});

/**
 * SECURE Server Action: Create new user
 * Uses Data Access Layer for all authentication and authorization
 */
export async function createUserAction(formData: FormData) {
  try {
    // Input validation
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    const validatedData = createUserSchema.parse(rawData);

    // Use secure Data Access Layer (handles auth automatically)
    const user = await createUser(validatedData);

    // Revalidate admin pages
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

/**
 * SECURE Server Action: Update user
 * Uses Data Access Layer for all authentication and authorization
 */
export async function updateUserAction(userId: string, formData: FormData) {
  try {
    // Input validation
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    };

    const validatedData = updateUserSchema.parse(rawData);

    // Use secure Data Access Layer (handles auth automatically)
    const user = await updateUser(userId, validatedData);

    // Revalidate admin pages
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User updated successfully",
      user,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * SECURE Server Action: Delete user
 * Uses Data Access Layer for all authentication and authorization
 */
export async function deleteUserAction(userId: string) {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    await deleteUser(userId);

    // Revalidate admin pages
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * SECURE Server Action: Get users list
 * Uses Data Access Layer for all authentication and authorization
 */
export async function getUsersAction(page = 1, limit = 10, search = "") {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    const { users, totalCount } = await getUsers(page, limit, search || undefined);

    return {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
      users: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    };
  }
}
