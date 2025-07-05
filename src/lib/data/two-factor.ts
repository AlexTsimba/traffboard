import "server-only";

import bcryptjs from "bcryptjs";
import { authenticator } from "otplib";
import qrcode from "qrcode";

import { prisma } from "../prisma";

import { auditLog, requireAuth } from "./auth";

// Configure TOTP for better security and compatibility
authenticator.options = {
  ...authenticator.options,
  window: 1, // Allow ±30 seconds tolerance
  step: 30, // 30-second window
};

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
 * Check if user requires 2FA for login (public function, no auth required)
 */
export async function checkUserRequires2FA(
  email: string,
  password: string,
): Promise<{
  requires2FA: boolean;
  userId: string;
}> {
  // Find user and verify credentials
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      totpSecret: true,
    },
  });

  if (!user?.passwordHash) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    throw new Error("Invalid credentials");
  }

  // Check if 2FA is enabled
  const requires2FA = !!user.totpSecret;

  auditLog("2fa.login_check", user.id, { requires2FA });

  return {
    requires2FA,
    userId: user.id,
  };
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

  // Verify the TOTP code with proper time tolerance
  const isValid = authenticator.check(code, secret);

  if (!isValid) {
    auditLog("2fa.enable_failed", currentUser.id, { reason: "invalid_code" });
    throw new Error("Invalid verification code. Please check your authenticator app and system clock.");
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
  const codeValid = authenticator.check(code, user.totpSecret);

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
export async function admin2FAReset(userId: string): Promise<{
  userId: string;
  userName: string | null;
  userEmail: string;
}> {
  const admin = await requireAuth();

  if (admin.role !== "superuser") {
    throw new Error("Admin access required");
  }

  // Check if target user exists and has 2FA enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, totpSecret: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.totpSecret) {
    throw new Error("User does not have 2FA enabled");
  }

  // Prevent admin from resetting their own 2FA via this endpoint
  if (userId === admin.id) {
    throw new Error("Cannot reset your own 2FA via admin endpoint. Use account settings instead.");
  }

  // Reset 2FA by removing the secret
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: null,
      lastModifiedBy: admin.id,
    },
  });

  auditLog("admin_reset", admin.id, {
    targetUserId: userId,
    targetEmail: user.email,
  });

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
  };
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
    // If user has no secret, 2FA is not enabled, so verification "passes" in a sense
    // The calling context (e.g., middleware) should handle this case
    return true;
  }

  const isValid = authenticator.check(code, user.totpSecret);

  if (!isValid) {
    auditLog("2fa.verify_failed", userId, { reason: "invalid_code" });
    return false;
  }

  return true;
}
