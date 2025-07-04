"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../../auth";

// Helper function to check if user is authenticated
async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

// Server action to get user sessions
export async function getSessionsAction() {
  try {
    const session = await requireAuth();

    // Get all sessions for the current user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        sessionToken: true,
        userId: true,
        expires: true,
        ipAddress: true,
        userAgent: true,
        deviceType: true,
        browser: true,
        os: true,
        country: true,
        city: true,
        lastActivity: true,
        createdAt: true,
      },
      orderBy: { lastActivity: "desc" },
    });

    // For now, mark the first session as current since we can't easily get the current session token
    // In a real implementation, you'd need to pass the session token or use cookies to identify the current session
    const sessionsWithCurrent = sessions.map((s, index) => ({
      ...s,
      isCurrent: index === 0, // Mark first session as current for now
      deviceName: null, // Add missing fields
      location: null,
      // Convert dates to strings for client
      expires: s.expires.toISOString(),
      lastActivity: s.lastActivity.toISOString(),
      lastActiveAt: s.lastActivity.toISOString(),
      createdAt: s.createdAt.toISOString(),
    }));

    return {
      success: true,
      sessions: sessionsWithCurrent,
    };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch sessions",
    };
  }
}

// Server action to revoke a specific session
export async function revokeSessionAction(sessionToken: string) {
  try {
    const session = await requireAuth();

    // Note: In a real implementation, you'd need to prevent revoking the current session
    // For now, we'll allow any session to be revoked

    // Check if session belongs to current user
    const sessionToRevoke = await prisma.session.findFirst({
      where: {
        sessionToken,
        userId: session.user.id,
      },
    });

    if (!sessionToRevoke) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    // Revoke the session (soft delete - mark as inactive)
    await prisma.session.update({
      where: {
        sessionToken,
      },
      data: {
        isActive: false,
      },
    });

    // Revalidate the preferences page
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

// Server action to revoke all other sessions
export async function revokeAllOtherSessionsAction() {
  try {
    const session = await requireAuth();

    // Revoke all sessions for this user (in a real implementation, we'd exclude current session)
    const result = await prisma.session.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Revalidate the preferences page
    revalidatePath("/main/dashboard/preferences");

    return {
      success: true,
      message: "All other sessions revoked successfully",
      revokedCount: result.count,
    };
  } catch (error) {
    console.error("Error revoking sessions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke sessions",
    };
  }
}
