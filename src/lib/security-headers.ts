// ── Security Headers ─────────────────────────────────────────────
// Defense-in-depth: these headers are applied at the Next.js middleware layer.
// Nginx also sets similar headers, providing dual enforcement.

import type { NextResponse } from 'next/server';

/**
 * Security header definitions.
 * Each entry maps a header name to its value.
 */
export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

/**
 * Apply all security headers to a NextResponse.
 * Mutates and returns the response for chaining.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }
  return response;
}
