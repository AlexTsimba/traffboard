import { NextResponse } from "next/server";
import { testDatabaseConnection, ensureDatabaseTables } from "@/lib/db-test";

export async function GET() {
  try {
    const connectionTest = await testDatabaseConnection();
    const tablesTest = await ensureDatabaseTables();
    
    return NextResponse.json({
      success: connectionTest.success && tablesTest.success,
      connection: connectionTest,
      tables: tablesTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}