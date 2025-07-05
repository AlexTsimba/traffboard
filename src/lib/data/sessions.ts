// DEPRECATED: Sessions moved to JWT-only strategy
// This file is kept for reference but should not be used

/* eslint-disable @typescript-eslint/no-unused-vars, sonarjs/no-duplicate-string */
import "server-only";

import { prisma } from "../prisma";

import { auditLog, requireAuth, type AuthenticatedUser } from "./auth";

/**
 * Safe session data for client exposure
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
 * Get all active sessions for current user
 */
export async function getUserSessions(): Promise<{
  sessions: SafeSession[];
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAuth();

  const sessions = await prisma.session.findMany({
    where: {
      userId: currentUser.id,
      isActive: true,
      expires: {
        gt: new Date(),
      },
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

  const safeSessions: SafeSession[] = sessions.map((session, index) => ({
    ...session,
    isCurrent: index === 0,
  }));

  void auditLog("sessions.list", currentUser.id);

  return { sessions: safeSessions, currentUser };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionToken: string): Promise<void> {
  const currentUser = await requireAuth();

  const session = await prisma.session.findFirst({
    where: {
      sessionToken,
      userId: currentUser.id,
    },
  });

  if (!session) {
    throw new Error("Session not found or access denied");
  }

  await prisma.session.update({
    where: { sessionToken },
    data: { isActive: false },
  });

  void auditLog("sessions.revoke", currentUser.id, {
    sessionToken: sessionToken.slice(0, 8) + "...",
  });
}

/**
 * Revoke all other sessions except current
 */
export async function revokeAllOtherSessions(): Promise<{ revokedCount: number }> {
  const currentUser = await requireAuth();

  const result = await prisma.session.updateMany({
    where: {
      userId: currentUser.id,
      isActive: true,
    },
    data: { isActive: false },
  });

  void auditLog("sessions.revoke_all", currentUser.id, {
    revokedCount: result.count,
  });

  return { revokedCount: result.count };
}

/**
 * Update session activity
 */
export async function updateSessionActivity(
  sessionToken: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
  },
): Promise<void> {
  await prisma.session.update({
    where: { sessionToken },
    data: {
      lastActivity: new Date(),
      ...metadata,
    },
  });
}
