import { eq } from "drizzle-orm";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { createDbConnection, TEST_DB_CONFIG } from "../config";
import * as schema from "../schema";

describe("Database Schema Tests", () => {
  let connection: ReturnType<typeof createDbConnection>;

  beforeAll(() => {
    connection = createDbConnection(TEST_DB_CONFIG);
  });

  afterAll(async () => {
    await connection.sql.end();
  });

  describe("Table Creation and Structure", () => {
    it("should have all required tables", async () => {
      const { sql } = connection;

      // Check if all our tables exist
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('traffic_reports', 'player_data')
        ORDER BY table_name
      `;

      expect(tables).toHaveLength(2);
      expect(tables[0].table_name).toBe("player_data");
      expect(tables[1].table_name).toBe("traffic_reports");
    });

    it("should have correct column structure for traffic_reports", async () => {
      const { sql } = connection;

      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'traffic_reports'
        ORDER BY ordinal_position
      `;

      // Check key columns exist
      const columnNames = columns.map((col: any) => col.column_name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("date");
      expect(columnNames).toContain("foreign_brand_id");
      expect(columnNames).toContain("traffic_source");
      expect(columnNames).toContain("all_clicks");
      expect(columnNames).toContain("unique_clicks");
      expect(columnNames).toContain("registrations_count");
    });

    it("should have correct column structure for player_data", async () => {
      const { sql } = connection;

      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'player_data'
        ORDER BY ordinal_position
      `;

      // Check key columns exist
      const columnNames = columns.map((col: any) => col.column_name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("player_id");
      expect(columnNames).toContain("date");
      expect(columnNames).toContain("sign_up_date");
      expect(columnNames).toContain("first_deposit_date");
      expect(columnNames).toContain("casino_real_ngr");
      expect(columnNames).toContain("deposits_sum");
    });

    it("should have proper indexes for time-series queries", async () => {
      const { sql } = connection;

      // Check indexes exist for efficient time-series queries
      const indexes = await sql`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND (tablename = 'traffic_reports' OR tablename = 'player_data')
        ORDER BY tablename, indexname
      `;

      const indexNames = indexes.map((idx: any) => idx.indexname);

      // Should have date indexes for time-series queries
      expect(indexNames.some((name: string) => name.includes("date"))).toBe(true);
    });

    it("should allow negative NGR values", async () => {
      const { db } = connection;

      // Test inserting a record with negative casino_real_ngr
      const testRecord = {
        playerId: "test_negative_ngr_player",
        date: new Date("2025-06-01"),
        casinoRealNgr: "-15.50", // Negative NGR should be allowed
      };

      const result = await db.insert(schema.playerData).values(testRecord).returning();

      expect(result).toHaveLength(1);
      expect(result[0].casinoRealNgr).toBe("-15.50");
      expect(result[0].playerId).toBe("test_negative_ngr_player");

      // Clean up
      await db.delete(schema.playerData).where(eq(schema.playerData.playerId, "test_negative_ngr_player"));
    });
  });
});
