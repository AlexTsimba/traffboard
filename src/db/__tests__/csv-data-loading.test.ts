import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";
import { createDbConnection, TEST_DB_CONFIG } from "../config";
import { trafficReports, playerData } from "../schema";

describe("CSV Data Loading Tests", () => {
  let db: ReturnType<typeof createDbConnection>["db"];
  let connection: ReturnType<typeof createDbConnection>["sql"];

  beforeAll(async () => {
    const dbConn = createDbConnection(TEST_DB_CONFIG);
    db = dbConn.db;
    connection = dbConn.sql;
  });

  afterAll(async () => {
    await connection.end();
  });

  beforeEach(async () => {
    // Clean tables before each test
    await db.delete(trafficReports);
    await db.delete(playerData);
  });

  describe("Traffic Report CSV Loading", () => {
    it("should load traffic report CSV data correctly", async () => {
      // Read the actual CSV file
      const csvPath = join(process.cwd(), "src/data/demo/traffic_report (20).csv");
      const csvContent = readFileSync(csvPath, "utf-8");
      const lines = csvContent.trim().split("\n");
      const headers = lines[0].split(",");
      
      // Verify CSV structure matches our schema
      expect(headers).toEqual([
        "date",
        "foreign_brand_id", 
        "foreign_partner_id",
        "foreign_campaign_id",
        "foreign_landing_id",
        "traffic_source",
        "device_type",
        "user_agent_family",
        "os_family",
        "country",
        "all_clicks",
        "unique_clicks", 
        "registrations_count",
        "ftd_count",
        "deposits_count",
        "cr",
        "cftd",
        "cd",
        "rftd"
      ]);

      // Parse and load first 10 rows
      const sampleRows = lines.slice(1, 11);
      const records = [];

      for (const line of sampleRows) {
        const values = line.split(",");
        
        // Handle empty strings and convert types
        const parseIntOrNull = (val: string) => val === "" ? null : parseInt(val);
        const parseFloatOrZero = (val: string) => val === "" ? 0 : parseFloat(val);
        const parseStringOrNull = (val: string) => val === '""' || val === "" ? null : val.replace(/"/g, "");

        const record = {
          date: new Date(values[0]),
          foreignBrandId: parseIntOrNull(values[1]),
          foreignPartnerId: parseIntOrNull(values[2]), 
          foreignCampaignId: parseIntOrNull(values[3]),
          foreignLandingId: parseIntOrNull(values[4]),
          trafficSource: parseStringOrNull(values[5]),
          deviceType: parseStringOrNull(values[6]),
          userAgentFamily: parseStringOrNull(values[7]),
          osFamily: parseStringOrNull(values[8]),
          country: parseStringOrNull(values[9]),
          allClicks: parseFloatOrZero(values[10]),
          uniqueClicks: parseFloatOrZero(values[11]),
          registrationsCount: parseFloatOrZero(values[12]),
          ftdCount: parseFloatOrZero(values[13]),
          depositsCount: parseFloatOrZero(values[14]),
          cr: parseFloatOrZero(values[15]),
          cftd: parseFloatOrZero(values[16]),
          cd: parseFloatOrZero(values[17]),
          rftd: parseFloatOrZero(values[18]),
        };

        records.push(record);
      }

      // Insert all records at once
      const results = await db.insert(trafficReports).values(records).returning();
      
      expect(results).toHaveLength(10);
      expect(results[0].date.toISOString().startsWith("2025-05-01")).toBe(true);
      expect(results[0].foreignBrandId).toBe(114);
      expect(results[0].country).toBe("AU");
    });
  });

  describe("Player Data CSV Loading", () => {
    it("should load player data CSV with negative NGR values", async () => {
      // Read the actual CSV file
      const csvPath = join(process.cwd(), "src/data/demo/overall_rows (3).csv");
      const csvContent = readFileSync(csvPath, "utf-8");
      const lines = csvContent.trim().split("\n");
      
      // Find the row with negative NGR (line 10 in the file has -2.81)
      const negativeNgrLine = lines.find(line => line.includes("-2.81"));
      expect(negativeNgrLine).toBeDefined();

      // Parse the negative NGR row
      const values = negativeNgrLine!.split(",");
      
      // Helper functions
      const parseIntOrNull = (val: string) => val === "" ? null : parseInt(val);
      const parseStringOrNull = (val: string) => val === '""' || val === "" ? null : val.replace(/"/g, "");
      const parseFloatOrZero = (val: string) => val === "" ? "0.00" : val;
      const parseDate = (val: string) => val === "" ? null : new Date(val);

      const record = {
        playerId: values[0],
        originalPlayerId: parseStringOrNull(values[1]),
        signUpDate: parseDate(values[2]),
        firstDepositDate: parseDate(values[3]),
        partnerId: parseIntOrNull(values[4]),
        companyName: parseStringOrNull(values[5]),
        // Skip Partners email (index 6) - PII
        partnerTags: parseStringOrNull(values[7]),
        campaignId: parseIntOrNull(values[8]),
        campaignName: parseStringOrNull(values[9]),
        promoId: parseIntOrNull(values[10]),
        promoCode: parseStringOrNull(values[11]),
        playerCountry: parseStringOrNull(values[12]),
        tagClickid: parseStringOrNull(values[13]),
        tagOs: parseStringOrNull(values[14]),
        tagSource: parseStringOrNull(values[15]),
        tagSub2: parseStringOrNull(values[16]),
        tagWebId: parseStringOrNull(values[17]),
        date: parseDate(values[18]),
        prequalified: parseIntOrNull(values[19]) || 0,
        duplicate: parseIntOrNull(values[20]) || 0,
        selfExcluded: parseIntOrNull(values[21]) || 0,
        disabled: parseIntOrNull(values[22]) || 0,
        currency: parseStringOrNull(values[23]),
        ftdCount: parseIntOrNull(values[24]) || 0,
        ftdSum: parseFloatOrZero(values[25]),
        depositsCount: parseIntOrNull(values[26]) || 0,
        depositsSum: parseFloatOrZero(values[27]),
        cashoutsCount: parseIntOrNull(values[28]) || 0,
        cashoutsSum: parseFloatOrZero(values[29]),
        casinoBetsCount: parseIntOrNull(values[30]) || 0,
        casinoRealNgr: parseFloatOrZero(values[31]), // This should be -2.81
        fixedPerPlayer: parseFloatOrZero(values[32]),
        casinoBetsSum: parseFloatOrZero(values[33]),
        casinoWinsSum: parseFloatOrZero(values[34]),
      };

      // Insert the record with negative NGR
      const result = await db.insert(playerData).values(record).returning();
      
      expect(result).toHaveLength(1);
      expect(result[0].casinoRealNgr).toBe("-2.81");
      expect(result[0].playerId).toBe("25291893");
      expect(result[0].partnerId).toBe(153278);
    });

    it("should load multiple player records for different dates", async () => {
      // Read first few lines of player data
      const csvPath = join(process.cwd(), "src/data/demo/overall_rows (3).csv");
      const csvContent = readFileSync(csvPath, "utf-8");
      const lines = csvContent.trim().split("\n");
      
      // Process first 5 data rows (skip header)
      const sampleRows = lines.slice(1, 6);
      const records = [];

      for (const line of sampleRows) {
        const values = line.split(",");
        
        const parseIntOrNull = (val: string) => val === "" ? null : parseInt(val);
        const parseStringOrNull = (val: string) => val === '""' || val === "" ? null : val.replace(/"/g, "");
        const parseFloatOrZero = (val: string) => val === "" ? "0.00" : val;
        const parseDate = (val: string) => val === "" ? null : new Date(val);

        const record = {
          playerId: values[0],
          originalPlayerId: parseStringOrNull(values[1]),
          signUpDate: parseDate(values[2]),
          firstDepositDate: parseDate(values[3]),
          partnerId: parseIntOrNull(values[4]),
          companyName: parseStringOrNull(values[5]),
          partnerTags: parseStringOrNull(values[7]),
          campaignId: parseIntOrNull(values[8]),
          campaignName: parseStringOrNull(values[9]),
          promoId: parseIntOrNull(values[10]),
          promoCode: parseStringOrNull(values[11]),
          playerCountry: parseStringOrNull(values[12]),
          tagClickid: parseStringOrNull(values[13]),
          tagOs: parseStringOrNull(values[14]),
          tagSource: parseStringOrNull(values[15]),
          tagSub2: parseStringOrNull(values[16]),
          tagWebId: parseStringOrNull(values[17]),
          date: parseDate(values[18]),
          prequalified: parseIntOrNull(values[19]) || 0,
          duplicate: parseIntOrNull(values[20]) || 0,
          selfExcluded: parseIntOrNull(values[21]) || 0,
          disabled: parseIntOrNull(values[22]) || 0,
          currency: parseStringOrNull(values[23]),
          ftdCount: parseIntOrNull(values[24]) || 0,
          ftdSum: parseFloatOrZero(values[25]),
          depositsCount: parseIntOrNull(values[26]) || 0,
          depositsSum: parseFloatOrZero(values[27]),
          cashoutsCount: parseIntOrNull(values[28]) || 0,
          cashoutsSum: parseFloatOrZero(values[29]),
          casinoBetsCount: parseIntOrNull(values[30]) || 0,
          casinoRealNgr: parseFloatOrZero(values[31]),
          fixedPerPlayer: parseFloatOrZero(values[32]),
          casinoBetsSum: parseFloatOrZero(values[33]),
          casinoWinsSum: parseFloatOrZero(values[34]),
        };

        records.push(record);
      }

      // Insert all records
      const results = await db.insert(playerData).values(records).returning();
      
      expect(results).toHaveLength(5);
      
      // Verify we can have same player on multiple dates (time series)
      const playerCounts = results.reduce((acc, record) => {
        acc[record.playerId] = (acc[record.playerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Player 22027429 appears 3 times in the first 5 rows
      expect(playerCounts["22027429"]).toBe(3);
    });
  });

  describe("Data Integrity and Constraints", () => {
    it("should maintain referential integrity for time series data", async () => {
      // Test that we can query time series data efficiently
      const testData = [
        {
          playerId: "player1",
          date: new Date("2025-06-01"),
          partnerId: 100,
          casinoRealNgr: "50.00",
        },
        {
          playerId: "player1", 
          date: new Date("2025-06-02"),
          partnerId: 100,
          casinoRealNgr: "-10.00", // Loss day
        },
        {
          playerId: "player1",
          date: new Date("2025-06-03"), 
          partnerId: 100,
          casinoRealNgr: "25.00",
        },
      ];

      await db.insert(playerData).values(testData);

      // Query time series data
      const results = await db
        .select()
        .from(playerData)
        .where(sql`player_id = 'player1'`)
        .orderBy(sql`date ASC`);

      expect(results).toHaveLength(3);
      expect(results[0].casinoRealNgr).toBe("50.00");
      expect(results[1].casinoRealNgr).toBe("-10.00"); // Negative NGR is valid
      expect(results[2].casinoRealNgr).toBe("25.00");

      // Aggregate query (total NGR across time)
      const totalNgr = results.reduce((sum, row) => 
        sum + parseFloat(row.casinoRealNgr), 0
      );
      expect(totalNgr).toBe(65.00); // 50 - 10 + 25
    });
  });
});