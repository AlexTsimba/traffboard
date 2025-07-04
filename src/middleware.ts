// MIDDLEWARE AUTHENTICATION REMOVED DUE TO CVE-2025-29927 VULNERABILITY
//
// This middleware approach is vulnerable to bypass attacks.
// Authentication is now handled at the page component level for security.
//
// See:
// - https://github.com/vercel/next.js/security/advisories
// - /src/lib/auth/page-protection.ts for new security implementation
//
// If you need to add middleware for other purposes (e.g., redirects, headers),
// do NOT use it for authentication checks.

// Example of SAFE middleware usage (no auth):
// export function middleware(request: NextRequest) {
//   // Only use for non-auth purposes like:
//   // - Setting security headers
//   // - Logging requests
//   // - Redirects based on URL patterns
//
//   // NEVER check authentication in middleware
// }

// Leave this file empty or add only non-auth middleware
export function middleware() {
  // Intentionally empty - auth handled at page level
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
