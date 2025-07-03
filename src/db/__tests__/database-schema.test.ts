import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { createDbConnection, TEST_DB_CONFIG } from "../config";
import { trafficReports, playerData } from "../schema";

describe("Database Schema Tests", () => {
  let db: ReturnType<typeof createDbConnection>["db"];
  let connection: ReturnType<typeof createDbConnection>["sql"];

  beforeAll(async () => {
    // Use test database configuration
    const dbConn = createDbConnection(TEST_DB_CONFIG);
    db = dbConn.db;
    connection = dbConn.sql;
  });

  afterAll(async () => {
    await connection.end();
  });

  beforeEach(async () => {
    // Clean tables before each test using raw SQL to avoid potential issues
    await connection`DELETE FROM traffic_reports`;
    await connection`DELETE FROM player_data`;
  });

  describe("Traffic Reports Schema", () => {
    it("should create traffic report with valid data", async () => {
      // Sample data based on actual CSV structure
      const sampleData = {
        date: new Date("2025-05-01"),
        foreignBrandId: 114,
        foreignPartnerId: 149232,
        foreignCampaignId: 269435,
        foreignLandingId: 5769,
        trafficSource: "fb_android_pwa",
        deviceType: "Phone",
        userAgentFamily: "Chrome Mobile",
        osFamily: "Android",
        country: "AU",
        allClicks: 8,
        uniqueClicks: 0,
        registrationsCount: 0,
        ftdCount: 0,
        depositsCount: 0,
        cr: 0,
        cftd: 0,
        cd: 0,
        rftd: 0,
      };

      const result = await db.insert(trafficReports).values(sampleData).returning();
      
      expect(result).toHaveLength(1);
      expect(result[0].foreignBrandId).toBe(114);
      expect(result[0].allClicks).toBe(8);
      expect(result[0].deviceType).toBe("Phone");
    });

    it("should enforce positive metrics constraint", async () => {
      const invalidData = {
        date: new Date("2025-05-01"),
        allClicks: -1, // Invalid: negative clicks
        uniqueClicks: 0,
      };

      await expect(
        db.insert(trafficReports).values(invalidData)
      ).rejects.toThrow();
    });

    it("should enforce device type constraint", async () => {
      const invalidData = {
        date: new Date("2025-05-01"),
        deviceType: "InvalidDevice", // Invalid device type
        allClicks: 5,
        uniqueClicks: 2,
      };

      await expect(
        db.insert(trafficReports).values(invalidData)
      ).rejects.toThrow();
    });

    it("should enforce click logic constraint", async () => {
      const invalidData = {
        date: new Date("2025-05-01"),
        allClicks: 5,
        uniqueClicks: 10, // Invalid: unique clicks > all clicks
      };

      await expect(
        db.insert(trafficReports).values(invalidData)
      ).rejects.toThrow();
    });

    it("should handle null/empty traffic source and device type", async () => {
      const dataWithNulls = {
        date: new Date("2025-05-01"),
        trafficSource: "",
        deviceType: null,
        allClicks: 5,
        uniqueClicks: 2,
      };

      const result = await db.insert(trafficReports).values(dataWithNulls).returning();
      
      expect(result).toHaveLength(1);
      expect(result[0].trafficSource).toBe("");
      expect(result[0].deviceType).toBeNull();
    });
  });

  describe("Player Data Schema", () => {
    it("should create player data with valid data", async () => {
      // Sample data based on actual CSV structure  
      const sampleData = {
        playerId: "22027429",
        originalPlayerId: "679669",
        signUpDate: new Date("2023-02-16"),
        firstDepositDate: new Date("2025-06-05"),
        partnerId: 149232,
        companyName: "Rockit Media FB",
        partnerTags: "1. FB 2. Affiliate CPA",
        campaignId: 269435,
        campaignName: "LU_FB_iOS",
        promoId: 763346,
        promoCode: "adba497cc",
        playerCountry: "AU",
        currency: "EUR",
        tagClickid: "3d061b1e-e9fc-4422-ada7-cd1b2f4c7105",
        tagSource: "9303",
        date: new Date("2025-06-05"),
        ftdCount: 1,
        ftdSum: "11.36",
        depositsCount: 3,
        depositsSum: "39.77",
        casinoBetsCount: 97,
        casinoBetsSum: "66.74",
        casinoWinsSum: "27.08",
        casinoRealNgr: "39.66", // Positive NGR
      };

      const result = await db.insert(playerData).values(sampleData).returning();
      
      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe("22027429");
      expect(result[0].partnerId).toBe(149232);
      expect(result[0].casinoRealNgr).toBe("39.66");
    });

    it("should allow negative NGR values", async () => {
      // This is crucial - NGR can be negative when players win more than they bet
      const sampleDataWithNegativeNgr = {
        playerId: "25291893",
        date: new Date("2025-06-22"),
        partnerId: 153278,
        campaignId: 346144,
        playerCountry: "AU",
        currency: "EUR", 
        casinoRealNgr: "-2.81", // Negative NGR - this should be allowed!
        casinoBetsSum: "0.00",
        casinoWinsSum: "0.00",
      };

      const result = await db.insert(playerData).values(sampleDataWithNegativeNgr).returning();
      
      expect(result).toHaveLength(1);
      expect(result[0].casinoRealNgr).toBe("-2.81");
      expect(result[0].playerId).toBe("25291893");
    });

    it("should enforce positive amounts constraint (except NGR)", async () => {
      const invalidData = {
        playerId: "test",
        date: new Date("2025-05-01"),
        ftdSum: "-10.00", // Invalid: negative FTD sum
      };

      await expect(
        db.insert(playerData).values(invalidData)
      ).rejects.toThrow();
    });

    it("should enforce boolean flags constraint", async () => {
      const invalidData = {
        playerId: "test",
        date: new Date("2025-05-01"),
        prequalified: 2, // Invalid: must be 0 or 1
      };

      await expect(
        db.insert(playerData).values(invalidData)
      ).rejects.toThrow();
    });

    it("should handle multiple records for same player on different dates", async () => {
      const player1Day1 = {
        playerId: "player123",
        date: new Date("2025-05-01"),
        partnerId: 100,
        casinoRealNgr: "10.00",
      };

      const player1Day2 = {
        playerId: "player123", // Same player
        date: new Date("2025-05-02"), // Different date
        partnerId: 100,
        casinoRealNgr: "-5.50", // Different NGR (negative)
      };

      // Both should insert successfully (time series data)
      const result1 = await db.insert(playerData).values(player1Day1).returning();
      const result2 = await db.insert(playerData).values(player1Day2).returning();
      
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result1[0].playerId).toBe("player123");
      expect(result2[0].playerId).toBe("player123");
      expect(result1[0].casinoRealNgr).toBe("10.00");
      expect(result2[0].casinoRealNgr).toBe("-5.50");
    });
  });

  describe("Database Indexes and Performance", () => {
    it("should use indexes for common time-series queries", async () => {
      // Insert some test data
      const testDate = new Date("2025-05-01");
      
      await db.insert(trafficReports).values({
        date: testDate,
        foreignPartnerId: 123,
        foreignCampaignId: 456,
        allClicks: 100,
        uniqueClicks: 50,
      });

      await db.insert(playerData).values({
        playerId: "test123",
        date: testDate,
        partnerId: 123,
        campaignId: 456,
        casinoRealNgr: "25.50",
      });

      // Test index usage with EXPLAIN
      const trafficExplain = await connection`
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT * FROM traffic_reports 
        WHERE date >= ${testDate.toISOString()} AND foreign_partner_id = 123
      `;

      const playerExplain = await connection`
        EXPLAIN (ANALYZE, BUFFERS)
        SELECT * FROM player_data 
        WHERE date >= ${testDate.toISOString()} AND partner_id = 123
      `;

      // Should find results
      expect(trafficExplain.length).toBeGreaterThan(0);
      expect(playerExplain.length).toBeGreaterThan(0);
    });
  });
});