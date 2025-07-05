"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { get2FAStatus, generate2FASetup, enable2FA, disable2FA, admin2FAReset } from "@/lib/data/two-factor";

// Input validation schemas
const enable2FASchema = z.object({
  secret: z.string().min(1, "Secret is required"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

const admin2FAResetSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * SECURE Server Action: Get current user's 2FA status
 */
export async function get2FAStatusAction() {
  try {
    const status = await get2FAStatus();

    return {
      success: true,
      status,
    };
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get 2FA status",
    };
  }
}

/**
 * SECURE Server Action: Generate 2FA setup data
 */
export async function generate2FASetupAction() {
  try {
    const setupData = await generate2FASetup();

    return {
      success: true,
      setupData,
    };
  } catch (error) {
    console.error("Error generating 2FA setup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate 2FA setup",
    };
  }
}

/**
 * SECURE Server Action: Enable 2FA
 */
export async function enable2FAAction(formData: FormData) {
  try {
    // Input validation with safe FormData handling
    const secret = formData.get("secret");
    const code = formData.get("code");

    const secretStr = typeof secret === "string" ? secret : "";
    const codeStr = typeof code === "string" ? code : "";

    const rawData = {
      secret: secretStr,
      code: codeStr,
    };

    const validatedData = enable2FASchema.parse(rawData);

    // Enable 2FA using DAL
    await enable2FA(validatedData.secret, validatedData.code);

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "2FA enabled successfully",
    };
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enable 2FA",
    };
  }
}

/**
 * SECURE Server Action: Disable 2FA
 */
export async function disable2FAAction(formData: FormData) {
  try {
    // Input validation with safe FormData handling
    const password = formData.get("password");
    const code = formData.get("code");

    const rawData = {
      password: typeof password === "string" ? password : "",
      code: typeof code === "string" ? code : "",
    };

    const validatedData = disable2FASchema.parse(rawData);

    // Disable 2FA using DAL
    await disable2FA(validatedData.password, validatedData.code);

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "2FA disabled successfully",
    };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disable 2FA",
    };
  }
}

/**
 * SECURE Server Action: Admin reset 2FA for any user
 */
export async function admin2FAResetAction(formData: FormData) {
  try {
    // Input validation
    const rawData = {
      userId: formData.get("userId"),
    };

    const validatedData = admin2FAResetSchema.parse(rawData);

    // Reset 2FA using DAL (requires admin permissions)
    await admin2FAReset(validatedData.userId);

    // Revalidate admin pages
    revalidatePath("/main/dashboard/administration");

    return {
      success: true,
      message: "2FA reset successfully for user",
    };
  } catch (error) {
    console.error("Error resetting 2FA:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset 2FA",
    };
  }
}
