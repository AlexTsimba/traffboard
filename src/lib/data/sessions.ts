// JWT-only session management
// Since we moved to JWT-only strategy, traditional session management is not needed

import "server-only";

import type { AuthenticatedUser } from "./auth";
import { auditLog, requireAuth } from "./auth";

/**
 * Safe session data for client exposure (JWT-based)
 */
export interface SafeSession {
  sessionToken: string;
  userId: string;
  expires: Date;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  lastActivity: Date;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Get current JWT session info
 * Note: JWT sessions are stateless, so we only return current session info
 */
export async function getUserSessions(): Promise<{
  sessions: SafeSession[];
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  // For JWT sessions, we only have the current session
  // Real session management would require storing JWT tokens somewhere
  const currentSession: SafeSession = {
    sessionToken: "jwt-session", // JWT tokens are not stored in DB
    userId: currentUser.id,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    ipAddress: null, // Would need request context
    userAgent: null, // Would need request context
    deviceType: null,
    browser: null,
    os: null,
    country: null,
    city: null,
    lastActivity: new Date(),
    createdAt: new Date(),
    isCurrent: true,
  };

  await auditLog("sessions.list", currentUser.id);

  return {
    sessions: [currentSession],
    currentUser,
  };
}

/**
 * Revoke JWT session (logout)
 * Note: JWT sessions cannot be revoked server-side without a blacklist
 */
export async function revokeSession(_sessionToken: string): Promise<void> {
  const currentUser = await requireAuth();

  // For JWT sessions, we can't revoke them server-side
  // The client should delete the JWT token
  // In a production app, you might want to implement a JWT blacklist

  await auditLog("sessions.revoke", currentUser.id, {
    sessionToken: "jwt-session",
    note: "JWT session logout requested",
  });

  // Throw an error to indicate that JWT sessions cannot be revoked server-side
  throw new Error("JWT sessions cannot be revoked server-side. Please logout on the client.");
}

/**
 * Revoke all other sessions except current
 * For JWT: This is essentially a no-op since JWT sessions are stateless
 */
export async function revokeAllOtherSessions(): Promise<number> {
  const currentUser = await requireAuth();

  await auditLog("sessions.revoke_all_others", currentUser.id);

  // Return 0 since JWT sessions are stateless
  return 0;
}

/**
 * Get session count for user
 * For JWT: Always returns 1 (current session)
 */
export async function getSessionCount(): Promise<number> {
  await requireAuth();
  return 1; // JWT sessions are stateless, only current session exists
}
