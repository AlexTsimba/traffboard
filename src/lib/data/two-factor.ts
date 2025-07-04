import "server-only";

import bcryptjs from "bcryptjs";
import { authenticator } from "otplib";
import qrcode from "qrcode";

import { prisma } from "../prisma";

import { auditLog, requireAuth } from "./auth";

/**
 * Safe 2FA setup data for client exposure
 */
export interface Safe2FASetup {
  secret: string;
  qrCode: string;
  qrUri: string;
  serviceName: string;
  accountName: string;
}

/**
 * 2FA status information
 */
export interface Safe2FAStatus {
  isEnabled: boolean;
  accountName: string;
}

/**
 * Get current user's 2FA status
 */
export async function get2FAStatus(): Promise<Safe2FAStatus> {
  const currentUser = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      totpSecret: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  auditLog("2fa.status_check", currentUser.id);

  return {
    isEnabled: !!user.totpSecret,
    accountName: user.email,
  };
}

/**
 * Generate 2FA setup data (secret, QR code)
 * Only works if 2FA is not already enabled
 */
export async function generate2FASetup(): Promise<Safe2FASetup> {
  const currentUser = await requireAuth();

  // Check if user already has 2FA enabled
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { totpSecret: true, email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.totpSecret) {
    throw new Error("2FA is already enabled");
  }

  // Generate new TOTP secret
  const secret = authenticator.generateSecret();

  // Create service name and account name for QR code
  const serviceName = "TraffBoard";
  const accountName = user.email;

  // Generate TOTP URL for QR code
  const qrUri = authenticator.keyuri(accountName, serviceName, secret);

  // Generate QR code as data URL
  const qrCode = await qrcode.toDataURL(qrUri);

  auditLog("2fa.setup_generated", currentUser.id);

  return {
    secret,
    qrCode,
    qrUri,
    serviceName,
    accountName,
  };
}

/**
 * Enable 2FA by verifying TOTP code and saving secret
 */
export async function enable2FA(secret: string, code: string): Promise<void> {
  const currentUser = await requireAuth();

  // Verify the TOTP code
  const isValid = authenticator.verify({
    token: code,
    secret,
  });

  if (!isValid) {
    auditLog("2fa.enable_failed", currentUser.id, { reason: "invalid_code" });
    throw new Error("Invalid verification code");
  }

  // Check if user already has 2FA enabled
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { totpSecret: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.totpSecret) {
    throw new Error("2FA is already enabled");
  }

  // Save the secret to enable 2FA
  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      totpSecret: secret,
      lastModifiedBy: currentUser.id,
    },
  });

  auditLog("2fa.enabled", currentUser.id);
}

/**
 * Disable 2FA with password and TOTP verification
 */
export async function disable2FA(password: string, code: string): Promise<void> {
  const currentUser = await requireAuth();

  // Get user with password hash and TOTP secret
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      passwordHash: true,
      totpSecret: true,
    },
  });

  if (!user?.passwordHash) {
    throw new Error("User not found or invalid authentication method");
  }

  if (!user.totpSecret) {
    throw new Error("2FA is not enabled");
  }

  // Verify password
  const passwordValid = await bcryptjs.compare(password, user.passwordHash);
  if (!passwordValid) {
    auditLog("2fa.disable_failed", currentUser.id, { reason: "invalid_password" });
    throw new Error("Invalid password");
  }

  // Verify TOTP code
  const codeValid = authenticator.verify({
    token: code,
    secret: user.totpSecret,
  });

  if (!codeValid) {
    auditLog("2fa.disable_failed", currentUser.id, { reason: "invalid_code" });
    throw new Error("Invalid verification code");
  }

  // Disable 2FA by removing the secret
  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      totpSecret: null,
      lastModifiedBy: currentUser.id,
    },
  });

  auditLog("2fa.disabled", currentUser.id);
}

/**
 * Admin function: Reset 2FA for any user
 * Only superusers can use this function
 */
export async function admin2FAReset(userId: string): Promise<void> {
  const admin = await requireAuth();

  if (admin.role !== "superuser") {
    throw new Error("Admin access required");
  }

  // Check if target user exists and has 2FA enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, totpSecret: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.totpSecret) {
    throw new Error("User does not have 2FA enabled");
  }

  // Reset 2FA by removing the secret
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: null,
      lastModifiedBy: admin.id,
    },
  });

  auditLog("2fa.admin_reset", admin.id, {
    targetUserId: userId,
    targetEmail: user.email,
  });
}

/**
 * Verify TOTP code for existing user (used during login)
 */
export async function verify2FACode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true },
  });

  if (!user?.totpSecret) {
    return false;
  }

  const isValid = authenticator.verify({
    token: code,
    secret: user.totpSecret,
  });

  auditLog("2fa.verification", userId, { success: isValid });

  return isValid;
}
