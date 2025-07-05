import { NextResponse } from "next/server";

export function GET() {
  try {
    // Sessions are now JWT-only, no database sessions to display
    return NextResponse.json({
      message: "Sessions moved to JWT-only strategy",
      totalSessions: 0,
      sessions: [],
      note: "JWT sessions are stateless and not stored in database",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
