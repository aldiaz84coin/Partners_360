import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "p360_session";
const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/evaluate", "/account", "/metodologia"];

// Lightweight cookie-presence gate. Fine-grained role checks (which need a DB
// lookup) happen in the server layouts, since Prisma's node-postgres adapter
// requires the Node runtime rather than the Edge runtime middleware runs in.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has(COOKIE_NAME);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/evaluate/:path*", "/account/:path*", "/metodologia/:path*"],
};
