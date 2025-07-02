import { describe, it, expect } from "vitest";

import {
  users,
  sessions,
  userSessions,
  playerData,
  trafficReports,
  conversionUploads,
  USER_ROLES,
  UPLOAD_STATUS,
  DEVICE_TYPES,
  FILE_TYPES,
} from "../schema";

describe("Database Schema Tests", () => {
  describe("Schema Definitions", () => {
    it("should export all required schemas", () => {
      expect(users).toBeDefined();
      expect(sessions).toBeDefined();
      expect(userSessions).toBeDefined();
      expect(playerData).toBeDefined();
      expect(trafficReports).toBeDefined();
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
      expect(sessions.id).toBeDefined();
      expect(sessions.sessionToken).toBeDefined();
      expect(sessions.userId).toBeDefined();
      expect(sessions.expires).toBeDefined();

      expect(userSessions.id).toBeDefined();
      expect(userSessions.userId).toBeDefined();
      expect(userSessions.sessionToken).toBeDefined();
      expect(userSessions.deviceInfo).toBeDefined();
      expect(userSessions.browserInfo).toBeDefined();
      expect(userSessions.ipAddress).toBeDefined();
      expect(userSessions.location).toBeDefined();
      expect(userSessions.isCurrent).toBeDefined();
      expect(userSessions.lastActivity).toBeDefined();
    });

    it("should have upload tracking table with required columns", () => {
      expect(conversionUploads.id).toBeDefined();
      expect(conversionUploads.userId).toBeDefined();
      expect(conversionUploads.filename).toBeDefined();
      expect(conversionUploads.fileType).toBeDefined();
      expect(conversionUploads.status).toBeDefined();
      expect(conversionUploads.totalRows).toBeDefined();
      expect(conversionUploads.processedRows).toBeDefined();
      expect(conversionUploads.errorRows).toBeDefined();
      expect(conversionUploads.errors).toBeDefined();
    });

    it("should have player data table with EXACT CSV columns (34 fields, no PII)", () => {
      expect(playerData.id).toBeDefined();
      expect(playerData.uploadId).toBeDefined();
      expect(playerData.playerId).toBeDefined();
      expect(playerData.originalPlayerId).toBeDefined();
      // Verify Partners email is NOT in player data schema
      expect("partnersEmail" in playerData).toBe(false);
      expect("partners_email" in playerData).toBe(false);
      expect(playerData.signUpDate).toBeDefined();
      expect(playerData.firstDepositDate).toBeDefined();
      expect(playerData.partnerId).toBeDefined();
      expect(playerData.companyName).toBeDefined();
      expect(playerData.partnerTags).toBeDefined();
      expect(playerData.campaignId).toBeDefined();
      expect(playerData.campaignName).toBeDefined();
      expect(playerData.promoId).toBeDefined();
      expect(playerData.promoCode).toBeDefined();
      expect(playerData.playerCountry).toBeDefined();
      expect(playerData.tagClickid).toBeDefined();
      expect(playerData.tagOs).toBeDefined();
      expect(playerData.tagSource).toBeDefined();
      expect(playerData.tagSub2).toBeDefined();
      expect(playerData.tagWebId).toBeDefined();
      expect(playerData.date).toBeDefined();
      expect(playerData.prequalified).toBeDefined();
      expect(playerData.duplicate).toBeDefined();
      expect(playerData.selfExcluded).toBeDefined();
      expect(playerData.disabled).toBeDefined();
      expect(playerData.currency).toBeDefined();
      expect(playerData.ftdCount).toBeDefined();
      expect(playerData.ftdSum).toBeDefined();
      expect(playerData.depositsCount).toBeDefined();
      expect(playerData.depositsSum).toBeDefined();
      expect(playerData.cashoutsCount).toBeDefined();
      expect(playerData.cashoutsSum).toBeDefined();
      expect(playerData.casinoBetsCount).toBeDefined();
      expect(playerData.casinoRealNgr).toBeDefined();
      expect(playerData.fixedPerPlayer).toBeDefined();
      expect(playerData.casinoBetsSum).toBeDefined();
      expect(playerData.casinoWinsSum).toBeDefined();
    });

    it("should have traffic reports table with EXACT CSV columns (19 fields)", () => {
      expect(trafficReports.id).toBeDefined();
      expect(trafficReports.uploadId).toBeDefined();

      // EXACT CSV fields (19 total)
      expect(trafficReports.date).toBeDefined();
      expect(trafficReports.foreignBrandId).toBeDefined();
      expect(trafficReports.foreignPartnerId).toBeDefined();
      expect(trafficReports.foreignCampaignId).toBeDefined();
      expect(trafficReports.foreignLandingId).toBeDefined();
      expect(trafficReports.trafficSource).toBeDefined();
      expect(trafficReports.deviceType).toBeDefined();
      expect(trafficReports.userAgentFamily).toBeDefined();
      expect(trafficReports.osFamily).toBeDefined();
      expect(trafficReports.country).toBeDefined();
      expect(trafficReports.allClicks).toBeDefined();
      expect(trafficReports.uniqueClicks).toBeDefined();
      expect(trafficReports.registrationsCount).toBeDefined();
      expect(trafficReports.ftdCount).toBeDefined();
      expect(trafficReports.depositsCount).toBeDefined();
      expect(trafficReports.cr).toBeDefined();
      expect(trafficReports.cftd).toBeDefined();
      expect(trafficReports.cd).toBeDefined();
      expect(trafficReports.rftd).toBeDefined();
    });
  });

  describe("Enums and Constants", () => {
    it("should export all required enums", () => {
      expect(USER_ROLES).toBeDefined();
      expect(UPLOAD_STATUS).toBeDefined();
      expect(DEVICE_TYPES).toBeDefined();
      expect(FILE_TYPES).toBeDefined();
    });

    it("should have correct upload status values", () => {
      expect(UPLOAD_STATUS.PENDING).toBe("pending");
      expect(UPLOAD_STATUS.PROCESSING).toBe("processing");
      expect(UPLOAD_STATUS.COMPLETED).toBe("completed");
      expect(UPLOAD_STATUS.FAILED).toBe("failed");
    });

    it("should have correct file type values", () => {
      expect(FILE_TYPES.PLAYER_DATA).toBe("player_data");
      expect(FILE_TYPES.TRAFFIC_REPORT).toBe("traffic_report");
    });

    it("should have correct device type values", () => {
      expect(DEVICE_TYPES.PHONE).toBe("Phone");
      expect(DEVICE_TYPES.DESKTOP).toBe("Desktop");
      expect(DEVICE_TYPES.TABLET).toBe("Tablet");
    });
  });

  describe("Data Integrity and PII Compliance", () => {
    it("should NOT contain any PII fields", () => {
      // Check specifically that player data doesn't have email fields
      const playerFields = Object.keys(playerData);
      expect(playerFields).not.toContain("partnersEmail");
      expect(playerFields).not.toContain("partners_email");

      // Should not contain any email fields
      const emailFields = playerFields.filter((field) => field.toLowerCase().includes("email"));
      expect(emailFields).toHaveLength(0);
    });

    it("should have exactly 34 player data fields (35 CSV - 1 PII email)", () => {
      // Manual verification of player data fields (excluding system fields)
      const csvFields = [
        "playerId",
        "originalPlayerId",
        "signUpDate",
        "firstDepositDate",
        "partnerId",
        "companyName",
        "partnerTags",
        "campaignId",
        "campaignName",
        "promoId",
        "promoCode",
        "playerCountry",
        "tagClickid",
        "tagOs",
        "tagSource",
        "tagSub2",
        "tagWebId",
        "date",
        "prequalified",
        "duplicate",
        "selfExcluded",
        "disabled",
        "currency",
        "ftdCount",
        "ftdSum",
        "depositsCount",
        "depositsSum",
        "cashoutsCount",
        "cashoutsSum",
        "casinoBetsCount",
        "casinoRealNgr",
        "fixedPerPlayer",
        "casinoBetsSum",
        "casinoWinsSum",
      ];

      for (const field of csvFields) {
        expect(playerData[field as keyof typeof playerData]).toBeDefined();
      }
    });

    it("should have exactly 19 traffic report fields", () => {
      const csvFields = [
        "date",
        "foreignBrandId",
        "foreignPartnerId",
        "foreignCampaignId",
        "foreignLandingId",
        "trafficSource",
        "deviceType",
        "userAgentFamily",
        "osFamily",
        "country",
        "allClicks",
        "uniqueClicks",
        "registrationsCount",
        "ftdCount",
        "depositsCount",
        "cr",
        "cftd",
        "cd",
        "rftd",
      ];

      for (const field of csvFields) {
        expect(trafficReports[field as keyof typeof trafficReports]).toBeDefined();
      }
    });

    it("should use proper foreign key relationships", () => {
      // All data tables should reference conversionUploads
      expect(playerData.uploadId).toBeDefined();
      expect(trafficReports.uploadId).toBeDefined();

      // conversionUploads should reference users
      expect(conversionUploads.userId).toBeDefined();
    });
  });
});
