"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/data/auth";
import { getCurrentUserProfile, updateUser, updateUserPassword } from "@/lib/data/users";

// Input validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
});

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

/**
 * SECURE Server Action: Get current user profile
 * Uses Data Access Layer for authentication
 */
export async function getProfileAction() {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    const profile = await getCurrentUserProfile();

    return {
      success: true,
      user: profile,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    };
  }
}

/**
 * SECURE Server Action: Update user profile
 * Uses Data Access Layer for all authentication and authorization
 */
export async function updateProfileAction(formData: FormData) {
  try {
    // Get current user ID for self-update
    const currentUser = await requireAuth();

    // Input validation
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
    };

    const validatedData = updateProfileSchema.parse(rawData);

    // Use secure Data Access Layer (handles auth automatically)
    const user = await updateUser(currentUser.id, validatedData);

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "Profile updated successfully",
      user,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * SECURE Server Action: Change user password
 * Uses Data Access Layer for all security checks
 */
export async function changePasswordAction(formData: FormData) {
  try {
    // Input validation
    const rawData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validatedData = changePasswordSchema.parse(rawData);

    // Use secure Data Access Layer (handles all security checks)
    await updateUserPassword(validatedData.currentPassword, validatedData.newPassword);

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change password",
    };
  }
}
