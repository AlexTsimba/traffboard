import { NextResponse } from "next/server";
import { testDemoDataProcessing } from "@/lib/demo-data-processor";

export async function GET() {
  try {
    const result = await testDemoDataProcessing();
    
    return NextResponse.json({
      success: true,
      message: "Demo data processing completed successfully",
      results: result,
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
      { status: 500 }
    );
  }
}