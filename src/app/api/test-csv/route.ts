import { NextResponse } from "next/server";

import { processDemoPlayerData, processDemoTrafficData } from "@/lib/demo-data-processor";

export async function GET() {
  try {
    const [playerResult, trafficResult] = await Promise.all([processDemoPlayerData(), processDemoTrafficData()]);

    return NextResponse.json({
      success: true,
      message: "Demo data processing completed successfully",
      results: {
        playerData: playerResult,
        trafficData: trafficResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Demo data processing test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
