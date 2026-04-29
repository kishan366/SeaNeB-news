import { NextResponse } from "next/server";

export function proxy(request) {

  const { pathname } = request.nextUrl;

  /* ---------- IGNORE STATIC ---------- */

  if (
    pathname.startsWith("/api/v1") ||
    pathname.includes("_next") ||
    pathname.includes(".well-known") ||
    pathname.includes("favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  /* PUBLIC ROUTES */

  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/user-register",
    "/api/v1/auth/refresh"
  ];

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  /* AUTH CHECK  */

  const csrfToken = request.cookies.get("csrf_token_news");
  const refreshToken = request.cookies.get("refresh_token_news");

  const isLoggedIn = !!csrfToken || !!refreshToken;

  /* IF PUBLIC, ALLOW  */

  if (isPublic) {
    // If logged in and trying to access login/otp, redirect to home listing
    const authPaths = ["/auth/login", "/auth/otp"];
    const isAuthPath = authPaths.some(path => pathname === path);
    const listingUrl = process.env.NEXT_PUBLIC_LISTING_URL || "/";

    if (isLoggedIn && isAuthPath) {
      return NextResponse.redirect(new URL(listingUrl, request.url));
    }
    
    return NextResponse.next();
  }

  /* PROTECTED ROUTES (Must be logged in) */

  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.well-known).*)",
  ],
};