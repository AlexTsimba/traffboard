import "server-only";

import { redirect } from "next/navigation";

import { auth } from "../../../auth";

/**
 * Page-level authentication protection
 * Replaces vulnerable middleware authentication approach
 */

export interface PageAuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

/**
 * Protect a page - require any authenticated user
 * Usage: const { user } = await requirePageAuth();
 */
export async function requirePageAuth(): Promise<PageAuthResult> {
  const session = await auth();

  if (!session?.user) {
    redirect("/main/auth/v1/login");
  }

  // At this point, session.user is guaranteed to exist and have the required fields
  const { id, email, name, role } = session.user;

  return {
    user: {
      id,
      email: email || "",
      name: name || null,
      role: role || "user",
    },
  };
}

/**
 * Protect a page - require admin role
 * Usage: const { user } = await requireAdminPageAuth();
 */
export async function requireAdminPageAuth(): Promise<PageAuthResult> {
  const { user } = await requirePageAuth();

  if (user.role !== "superuser") {
    redirect("/main/unauthorized");
  }

  return { user };
}

/**
 * Get current user if authenticated, null otherwise
 * Usage: const user = await getPageAuth();
 */
export async function getPageAuth(): Promise<PageAuthResult["user"] | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    // At this point, session.user is guaranteed to exist and have the required fields
    const { id, email, name, role } = session.user;

    return {
      id,
      email: email || "",
      name: name || null,
      role: role || "user",
    };
  } catch {
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPagePermission(_permission: string): Promise<boolean> {
  const user = await getPageAuth();

  if (!user) {
    return false;
  }

  // Admin has all permissions
  return user.role === "superuser";
}

/**
 * Redirect to login with return URL
 */
export function redirectToLogin(returnUrl?: string): never {
  const loginUrl = returnUrl ? `/main/auth/v1/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/main/auth/v1/login";

  redirect(loginUrl);
}
