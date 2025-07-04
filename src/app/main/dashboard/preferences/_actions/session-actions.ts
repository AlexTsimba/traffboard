"use server";

import { revalidatePath } from "next/cache";

import { getUserSessions, revokeSession, revokeAllOtherSessions } from "@/lib/data/sessions";

/**
 * SECURE Server Action: Get user sessions
 * Uses Data Access Layer for all authentication checks
 */
export async function getSessionsAction() {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    const { sessions } = await getUserSessions();

    return {
      success: true,
      sessions,
    };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sessions",
      sessions: [],
    };
  }
}

/**
 * SECURE Server Action: Revoke specific session
 * Uses Data Access Layer for all authentication and authorization
 */
export async function revokeSessionAction(sessionToken: string) {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    await revokeSession(sessionToken);

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "Session revoked successfully",
    };
  } catch (error) {
    console.error("Error revoking session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke session",
    };
  }
}

/**
 * SECURE Server Action: Revoke all other sessions
 * Uses Data Access Layer for all authentication and authorization
 */
export async function revokeAllOtherSessionsAction() {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    const { revokedCount } = await revokeAllOtherSessions();

    // Revalidate preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "All other sessions revoked successfully",
      revokedCount,
    };
  } catch (error) {
    console.error("Error revoking sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke sessions",
    };
  }
}
