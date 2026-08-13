import { NextResponse, type NextRequest } from "next/server";

// Lightweight gate for the authenticated app routes. This only checks for the
// presence of a session cookie (cheap, edge-safe); full HMAC verification and
// the user lookup happen server-side in the (app) layout via getCurrentUser().
const COOKIE_NAME = "loglead_session";

const PROTECTED = [
  "/dashboard",
  "/algo-insider",
  "/market",
  "/studio",
  "/post-generator",
  "/campagnes",
  "/calendar",
  "/content-analyzer",
  "/ia-visibility",
  "/geo",
  "/linkedin-analytics",
  "/templates",
  "/analytics",
  "/leads",
  "/inbox",
  "/logagent",
  "/connections",
  "/cmo-ia",
  "/profile",
  "/onboarding",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/algo-insider/:path*",
    "/market/:path*",
    "/studio/:path*",
    "/post-generator/:path*",
    "/calendar/:path*",
    "/content-analyzer/:path*",
    "/ia-visibility/:path*",
    "/geo/:path*",
    "/linkedin-analytics/:path*",
    "/templates/:path*",
    "/analytics/:path*",
    "/leads/:path*",
    "/inbox/:path*",
    "/logagent/:path*",
    "/connections/:path*",
    "/cmo-ia/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
