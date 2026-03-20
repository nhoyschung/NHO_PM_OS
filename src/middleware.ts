import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/security-headers';

const REQUEST_ID_HEADER = 'x-request-id';

function generateRequestId(): string {
  return crypto.randomUUID();
}

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

  // Clone headers to inject request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply security headers (defense-in-depth alongside nginx)
  applySecurityHeaders(response);

  // Attach request ID and response time to the response
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set('x-response-time', `${Date.now() - start}ms`);

  // Log request in production-compatible format
  if (process.env.NODE_ENV === 'production') {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'request',
        method: request.method,
        path: request.nextUrl.pathname,
        requestId,
        responseTimeMs: Date.now() - start,
      }),
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and pages, skip static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
