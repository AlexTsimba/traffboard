import "server-only";

import { prisma } from "../prisma";

import { auditLog, requireAdmin, requireAuth, type AuthenticatedUser } from "./auth";

/**
 * Data Transfer Objects for safe data exposure
 * Never return complete database objects to clients
 */
export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean; // Optional for admin interfaces
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
}

export interface UpdateUserDataAdmin extends UpdateUserData {
  isActive?: boolean;
  password?: string;
}

export interface SafeUserDetailed extends SafeUser {
  createdByUser?: { name: string | null; email: string } | null;
  lastModifiedByUser?: { name: string | null; email: string } | null;
  _count?: {
    uploads: number;
    sessions: number;
  };
}

/**
 * Get user list with authentication and role checks
 * Only admins can view user lists
 */
export async function getUsers(
  page = 1,
  limit = 10,
  search?: string,
): Promise<{
  users: SafeUser[];
  totalCount: number;
  currentUser: AuthenticatedUser;
}> {
  const currentUser = await requireAdmin();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  auditLog("users.list", currentUser.id, { page, limit, search });

  return { users, totalCount, currentUser };
}

/**
 * Get single user by ID with permission checks
 */
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const currentUser = await requireAuth();

  // Users can view their own profile, admins can view any profile
  if (currentUser.role !== "admin" && currentUser.id !== userId) {
    throw new Error("Permission denied");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  auditLog("users.view", currentUser.id, { targetUserId: userId });

  return user;
}

/**
 * Create new user with admin privileges required
 */
export async function createUser(userData: CreateUserData): Promise<SafeUser> {
  const currentUser = await requireAdmin();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Hash password
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(userData.password, 12);

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role,
      createdBy: currentUser.id,
      lastModifiedBy: currentUser.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  auditLog("users.create", currentUser.id, {
    targetUserId: user.id,
    targetEmail: user.email,
    role: user.role,
  });

  return user;
}
/**
 * Update user with proper permission checks
 */
export async function updateUser(userId: string, updateData: UpdateUserData): Promise<SafeUser> {
  const currentUser = await requireAuth();

  // Users can update their own profile (except role), admins can update any user
  if (currentUser.role !== "superuser" && currentUser.id !== userId) {
    throw new Error("Permission denied");
  }

  // Non-admins cannot change roles
  if (currentUser.role !== "superuser" && updateData.role) {
    throw new Error("Cannot change role");
  }

  // Check email uniqueness if being changed
  if (updateData.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: updateData.email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      lastModifiedBy: currentUser.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  auditLog("users.update", currentUser.id, {
    targetUserId: userId,
    changes: updateData,
  });

  return user;
}

/**
 * Delete user with admin privileges required
 */
export async function deleteUser(userId: string): Promise<void> {
  const currentUser = await requireAdmin();

  // Prevent self-deletion
  if (currentUser.id === userId) {
    throw new Error("Cannot delete own account");
  }

  // Get user before deletion for audit log
  const userToDelete = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!userToDelete) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  auditLog("users.delete", currentUser.id, {
    targetUserId: userId,
    targetEmail: userToDelete.email,
    targetRole: userToDelete.role,
  });
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<SafeUser> {
  const currentUser = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get user by ID with detailed information for admin view
 */
export async function getUserByIdAdmin(userId: string): Promise<SafeUserDetailed | null> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      _count: {
        select: {
          uploads: true,
          sessions: true,
        },
      },
    },
  });

  auditLog("users.admin_view", userId, { targetUserId: userId });

  return user;
}

/**
 * Update user with admin privileges (including password and isActive)
 */
export async function updateUserAdmin(userId: string, updateData: UpdateUserDataAdmin): Promise<SafeUserDetailed> {
  const currentUser = await requireAdmin();

  // Prevent editing yourself as admin with role changes in some cases
  if (currentUser.id === userId && updateData.role && updateData.role !== "superuser") {
    // Check if this is the last superuser
    const superuserCount = await prisma.user.count({
      where: { role: "superuser", isActive: true },
    });

    if (superuserCount <= 1) {
      throw new Error("Cannot remove superuser role from the last active superuser");
    }
  }

  // Check email uniqueness if being changed
  if (updateData.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: updateData.email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  // Prepare update data
  const finalUpdateData: {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    passwordHash?: string;
    lastModifiedBy: string;
  } = {
    lastModifiedBy: currentUser.id,
  };

  // Only add defined values
  if (updateData.name !== undefined) finalUpdateData.name = updateData.name;
  if (updateData.email !== undefined) finalUpdateData.email = updateData.email;
  if (updateData.role !== undefined) finalUpdateData.role = updateData.role;
  if (updateData.isActive !== undefined) finalUpdateData.isActive = updateData.isActive;

  // Hash password if provided
  if (updateData.password) {
    const bcrypt = await import("bcryptjs");
    finalUpdateData.passwordHash = await bcrypt.hash(updateData.password, 12);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: finalUpdateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      lastModifiedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  auditLog("users.admin_update", currentUser.id, {
    targetUserId: userId,
    changes: updateData,
  });

  return user;
}

/**
 * Deactivate user (soft delete) with admin privileges
 */
export async function deactivateUser(userId: string): Promise<void> {
  const currentUser = await requireAdmin();

  // Prevent self-deletion
  if (currentUser.id === userId) {
    throw new Error("Cannot delete own account");
  }

  // Get user before deletion for checks
  const userToDeactivate = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, email: true },
  });

  if (!userToDeactivate) {
    throw new Error("User not found");
  }

  // Prevent deleting the last superuser
  if (userToDeactivate.role === "superuser" && userToDeactivate.isActive) {
    const activeSuperuserCount = await prisma.user.count({
      where: { role: "superuser", isActive: true },
    });

    if (activeSuperuserCount <= 1) {
      throw new Error("Cannot delete the last active superuser");
    }
  }

  // Soft delete by deactivating
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      lastModifiedBy: currentUser.id,
    },
  });

  auditLog("users.deactivate", currentUser.id, {
    targetUserId: userId,
    targetEmail: userToDeactivate.email,
    targetRole: userToDeactivate.role,
  });
}

/**
 * Update current user's password with security checks
 */
export async function updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const currentUser = await requireAuth();

  // Get user with password hash for verification
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw new Error("User not found");
  }

  // Verify current password
  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    auditLog("users.password_change_failed", currentUser.id, {
      reason: "invalid_current_password",
    });
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      passwordHash: newPasswordHash,
      lastModifiedBy: currentUser.id,
    },
  });

  auditLog("users.password_changed", currentUser.id);
}
