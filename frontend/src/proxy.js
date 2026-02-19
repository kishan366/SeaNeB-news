// middleware.js
import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Ignore static files
  if (pathname.includes('.well-known') || pathname.includes('chrome') || 
      pathname.includes('_next') || pathname.includes('favicon.ico')) {
    return NextResponse.next();
  }
  
  // Public paths - बिना login के access
  const publicPaths = [
    '/auth/login',
    '/auth/otp',
    '/auth/otp-verify',
    '/auth/user-register',
    '/auth/business-register',
    '/auth/register',
    '/api/external/v1/auth/refresh',  // ✅ Add refresh endpoint
    '/api/external/v1/otp',           // ✅ Add OTP endpoints
    '/'
  ];
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
  
  // Get token from cookies
  const accessToken = request.cookies.get('access_token');
  
  // Public path - allow access
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Protected path - check token
  if (!accessToken) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.well-known).*)'],
};