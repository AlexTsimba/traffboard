// DEPRECATED: Sessions moved to JWT-only strategy
// This API route is no longer used - session management not available with JWT tokens

import { NextResponse } from "next/server";

const sessionResponse = {
  error: "Session management not available with JWT authentication",
  message: "Sessions are now handled via JWT tokens and cannot be individually managed",
};

// Return 410 Gone for any session management requests
export function GET() {
  return NextResponse.json(sessionResponse, { status: 410 });
}

export function DELETE() {
  return NextResponse.json(sessionResponse, { status: 410 });
}
