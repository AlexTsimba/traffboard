import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG API AUTH ===");

    // Check headers
    const cookies = request.headers.get("cookie");
    console.log("Request cookies:", cookies);

    // Check NextAuth session
    const session = await auth();
    console.log("NextAuth session:", session);

    // Check request details
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));

    return NextResponse.json({
      session,
      cookies,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
