import { NextResponse } from 'next/server';

export function proxy(request) {

  const { pathname } = request.nextUrl;

  // static files allow
  if (
    pathname.includes('/_next') ||
    pathname.includes('/assets') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  /*  API PROXY HEADERS FIX  */
  if (pathname.startsWith("/api/v1")) {
    const requestHeaders = new Headers(request.headers);
    
    // requestHeaders.set('Origin', 'http://localhost:3000');
    // requestHeaders.set('Referer', 'http://localhost:3000/');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const publicPages = [
    '/',
    '/Home',
    '/about',
    '/contact',
    '/partner-with-us',
    '/solutions',
    '/Faqs',
  ];

  const isPublicPage = publicPages.some(page =>
    pathname === page || pathname.startsWith(page + '/')
  );

  // correct cookie name
  const token = request.cookies.get('access_token_news');

  const response = NextResponse.next();

  response.headers.set(
    'x-user-authenticated',
    token ? 'true' : 'false'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};