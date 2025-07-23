import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
    // Get full session data to check 2FA completion
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // No session at all - redirect to login
    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // User has 2FA enabled but hasn't completed verification - redirect to 2FA
    if (session.user.twoFactorEnabled && !(session as any).twoFactorVerified) {
        return NextResponse.redirect(new URL("/auth/two-factor", request.url));
    }

    return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard", "/reports/conversions", "/reports/cohort", "/reports/quality", "/reports/landings", "/admin", "/settings"]
};