import { describe, it, expect, afterAll } from "vitest";

import { createDbConnection, TEST_DB_CONFIG } from "../config";

describe("Database Connection Test", () => {
  let connection: ReturnType<typeof createDbConnection>["sql"] | undefined;

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
  });

  it("should connect to test database", async () => {
    const { sql } = createDbConnection(TEST_DB_CONFIG);
    connection = sql;

    // Simple health check
    const result = await sql`SELECT 1 as health`;

    expect(result).toHaveLength(1);
    expect(result[0].health).toBe(1);
  });

  it("should verify tables exist", async () => {
    const { sql } = createDbConnection(TEST_DB_CONFIG);
    connection = sql;

    // Check if our tables exist
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
});
