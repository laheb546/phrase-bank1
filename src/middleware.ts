import { NextRequest, NextResponse } from "next/server";

/**
 * Simple password gate — only you can use the app.
 * Set APP_PASSWORD in Vercel environment variables.
 * If APP_PASSWORD is not set, the app stays open (no login).
 */
export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // No password configured → allow everyone (local dev stays easy)
  if (!password) {
    return NextResponse.next();
  }

  // Allow the login page itself and static assets
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("phrase_bank_auth");
  if (cookie?.value === password) {
    return NextResponse.next();
  }

  // Not authenticated → send to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and common static files.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
