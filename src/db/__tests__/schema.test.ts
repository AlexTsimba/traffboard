import { describe, it, expect } from "vitest";

import { users, sessions, userSessions, conversions, conversionUploads } from "../schema/index";

describe("Database Schema Tests", () => {
  describe("Schema Definitions", () => {
    it("should export all required schemas", () => {
      expect(users).toBeDefined();
      expect(sessions).toBeDefined();
      expect(userSessions).toBeDefined();
      expect(conversions).toBeDefined();
      expect(conversionUploads).toBeDefined();
    });

    it("should have users table with required columns", () => {
      expect(users.id).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.passwordHash).toBeDefined();
      expect(users.role).toBeDefined();
      expect(users.twoFactorEnabled).toBeDefined();
      expect(users.twoFactorSecret).toBeDefined();
      expect(users.recoveryCodes).toBeDefined();
      expect(users.notificationPreferences).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
    });

    it("should have sessions tables with required columns", () => {
      // NextAuth sessions
      expect(sessions.sessionToken).toBeDefined();
      expect(sessions.userId).toBeDefined();
      expect(sessions.expires).toBeDefined();

      // User sessions for UI
      expect(userSessions.id).toBeDefined();
      expect(userSessions.userId).toBeDefined();
      expect(userSessions.deviceInfo).toBeDefined();
      expect(userSessions.browserInfo).toBeDefined();
      expect(userSessions.ipAddress).toBeDefined();
      expect(userSessions.lastActivity).toBeDefined();
      expect(userSessions.isActive).toBeDefined();
    });

    it("should have conversions table without PII or computed fields", () => {
      // Required columns
      expect(conversions.id).toBeDefined();
      expect(conversions.uploadId).toBeDefined();
      expect(conversions.partnerId).toBeDefined();
      expect(conversions.campaignId).toBeDefined();
      expect(conversions.trafficDate).toBeDefined();
      expect(conversions.clicks).toBeDefined();
      expect(conversions.impressions).toBeDefined();
      expect(conversions.conversions).toBeDefined();
      expect(conversions.revenue).toBeDefined();

      // Should NOT have PII fields
      expect((conversions as unknown as Record<string, unknown>).email).toBeUndefined();
      expect((conversions as unknown as Record<string, unknown>).name).toBeUndefined();
      expect((conversions as unknown as Record<string, unknown>).phone).toBeUndefined();

      // Should NOT have computed fields
      expect((conversions as unknown as Record<string, unknown>).conversionRate).toBeUndefined();
      expect((conversions as unknown as Record<string, unknown>).costPerClick).toBeUndefined();
    });

    it("should have conversion uploads table with tracking fields", () => {
      expect(conversionUploads.id).toBeDefined();
      expect(conversionUploads.userId).toBeDefined();
      expect(conversionUploads.filename).toBeDefined();
      expect(conversionUploads.status).toBeDefined();
      expect(conversionUploads.totalRows).toBeDefined();
      expect(conversionUploads.processedRows).toBeDefined();
      expect(conversionUploads.errorRows).toBeDefined();
      expect(conversionUploads.errors).toBeDefined();
    });
  });

  describe("TypeScript Type Inference", () => {
    it("should provide proper TypeScript types", () => {
      type UserType = typeof users.$inferSelect;
      type SessionType = typeof sessions.$inferSelect;
      type ConversionType = typeof conversions.$inferSelect;
      type UploadType = typeof conversionUploads.$inferSelect;

      // These should compile without errors
      const userType: UserType = {} as UserType;
      const sessionType: SessionType = {} as SessionType;
      const conversionType: ConversionType = {} as ConversionType;
      const uploadType: UploadType = {} as UploadType;

      expect(userType).toBeDefined();
      expect(sessionType).toBeDefined();
      expect(conversionType).toBeDefined();
      expect(uploadType).toBeDefined();
    });
  });

  describe("Schema Export Integration", () => {
    it("should export all schemas from main index", async () => {
      const schemas = await import("../schema/index");
      expect(schemas.users).toBe(users);
      expect(schemas.sessions).toBe(sessions);
      expect(schemas.userSessions).toBe(userSessions);
      expect(schemas.conversions).toBe(conversions);
      expect(schemas.conversionUploads).toBe(conversionUploads);
    });

    it("should export types and constants", async () => {
      const exports = await import("../schema/index");
      expect(exports.USER_ROLES).toBeDefined();
      expect(exports.SESSION_STATUS).toBeDefined();
      expect(exports.UPLOAD_STATUS).toBeDefined();
      expect(exports.DEVICE_TYPES).toBeDefined();
      expect(exports.TRAFFIC_SOURCES).toBeDefined();
    });
  });
});
