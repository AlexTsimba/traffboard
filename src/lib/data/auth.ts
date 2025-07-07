import "server-only";

import { auth } from "../../../auth";
import { prisma } from "../prisma";

/**
 * Core authentication utilities for Data Access Layer
 * All data access functions must use these for security
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Get current authenticated user or throw error
 * This is the foundation of all data access security
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  console.log("[Auth] Checking authentication...");
  const session = await auth();
  console.log("[Auth] Session:", session ? { user: session.user } : "No session");

  if (!session?.user?.id) {
    console.log("[Auth] No session or user found");
    throw new Error("Authentication required");
  }

  // Additional security: verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Require admin role for sensitive operations
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (user.role !== "superuser") {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Check if current user has specific permission
 */
export async function hasPermission(_permission: string): Promise<boolean> {
  try {
    const user = await requireAuth();

    // Admin has all permissions, others currently don't
    // Add role-based permission logic here in the future
    return user.role === "superuser";
  } catch {
    return false;
  }
}

/**
 * Get current user session information
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

/**
 * Audit log for security events - persisted to database
 */
export async function auditLog(action: string, userId?: string, details?: Record<string, unknown>): Promise<void> {
  try {
    // Log to database for persistence
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details: details ? JSON.stringify(details) : null,
        // NOTE: IP address and user agent from request context can be added later
        ipAddress: null,
        userAgent: null,
      },
    });

    // Also log to console for development
    console.log("AUDIT:", {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
