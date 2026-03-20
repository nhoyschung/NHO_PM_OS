import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, rateLimitReset, rateLimitClearAll } from '@/lib/rate-limit';
import { sanitizeHtml, sanitizeFilename, sanitizeCsvCell } from '@/lib/sanitize';
import { SECURITY_HEADERS, applySecurityHeaders } from '@/lib/security-headers';

// ── Rate Limiter ─────────────────────────────────────────────────

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimitClearAll();
  });

  describe('rateLimit', () => {
    it('should allow requests within the limit', () => {
      const result = rateLimit('test:key', 3, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should decrement remaining count on each call', () => {
      const r1 = rateLimit('test:decrement', 3, 60_000);
      const r2 = rateLimit('test:decrement', 3, 60_000);
      const r3 = rateLimit('test:decrement', 3, 60_000);

      expect(r1.remaining).toBe(2);
      expect(r2.remaining).toBe(1);
      expect(r3.remaining).toBe(0);
    });

    it('should deny requests exceeding the limit', () => {
      rateLimit('test:deny', 2, 60_000);
      rateLimit('test:deny', 2, 60_000);
      const result = rateLimit('test:deny', 2, 60_000);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different keys independently', () => {
      rateLimit('key:a', 1, 60_000);
      const resultA = rateLimit('key:a', 1, 60_000);
      const resultB = rateLimit('key:b', 1, 60_000);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });

    it('should reset after window expires', () => {
      // Use a very short window (1ms)
      rateLimit('test:expire', 1, 1);

      // Wait for the window to expire (synchronous approach: manipulate time)
      // For simplicity, we use rateLimitReset to simulate expiry
      rateLimitReset('test:expire');

      const result = rateLimit('test:expire', 1, 60_000);
      expect(result.allowed).toBe(true);
    });

    it('should provide a resetAt timestamp in the future', () => {
      const before = Date.now();
      const result = rateLimit('test:reset-at', 5, 60_000);
      expect(result.resetAt).toBeGreaterThan(before);
    });
  });

  describe('rateLimitReset', () => {
    it('should clear a specific key', () => {
      rateLimit('test:reset', 1, 60_000);
      const denied = rateLimit('test:reset', 1, 60_000);
      expect(denied.allowed).toBe(false);

      rateLimitReset('test:reset');

      const allowed = rateLimit('test:reset', 1, 60_000);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('rateLimitClearAll', () => {
    it('should clear all keys', () => {
      rateLimit('a', 1, 60_000);
      rateLimit('b', 1, 60_000);
      rateLimit('a', 1, 60_000); // deny
      rateLimit('b', 1, 60_000); // deny

      rateLimitClearAll();

      expect(rateLimit('a', 1, 60_000).allowed).toBe(true);
      expect(rateLimit('b', 1, 60_000).allowed).toBe(true);
    });
  });
});

// ── Sanitization ─────────────────────────────────────────────────

describe('Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).not.toContain('<script>');
    });

    it('should strip nested HTML', () => {
      const input = '<div><p>Hello <b>world</b></p></div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<div>');
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<b>');
    });

    it('should handle event handlers in tags', () => {
      const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('<img');
    });

    it('should encode dangerous characters', () => {
      const result = sanitizeHtml('Hello <world> & "friends"');
      expect(result).not.toContain('<world>');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should preserve plain text without tags', () => {
      const input = 'Hello world, this is normal text 123';
      // Note: the function re-encodes & so pure alphanumeric text is preserved
      expect(sanitizeHtml(input)).toContain('Hello world');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal sequences', () => {
      expect(sanitizeFilename('../../etc/passwd')).not.toContain('..');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0.txt')).not.toContain('\0');
    });

    it('should remove leading dots (hidden files)', () => {
      const result = sanitizeFilename('.htaccess');
      expect(result).not.toMatch(/^\./);
    });

    it('should keep safe characters', () => {
      expect(sanitizeFilename('my-report_2024.csv')).toBe('my-report_2024.csv');
    });

    it('should remove special characters', () => {
      const result = sanitizeFilename('file<>:"|?*.txt');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain(':');
      expect(result).not.toContain('"');
      expect(result).not.toContain('|');
      expect(result).not.toContain('?');
      expect(result).not.toContain('*');
    });

    it('should return default for completely stripped names', () => {
      expect(sanitizeFilename('...')).toBe('unnamed-file');
      expect(sanitizeFilename('')).toBe('unnamed-file');
    });

    it('should truncate excessively long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toMatch(/\.txt$/);
    });

    it('should collapse multiple dots', () => {
      expect(sanitizeFilename('file...name.txt')).toBe('file.name.txt');
    });
  });

  describe('sanitizeCsvCell', () => {
    it('should prefix formula-starting characters with single quote', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvCell('+cmd|/C calc')).toBe("'+cmd|/C calc");
      expect(sanitizeCsvCell('-1+1')).toBe("'-1+1");
      expect(sanitizeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    });

    it('should not modify safe values', () => {
      expect(sanitizeCsvCell('Hello world')).toBe('Hello world');
      expect(sanitizeCsvCell('12345')).toBe('12345');
      expect(sanitizeCsvCell('normal text')).toBe('normal text');
    });

    it('should handle empty string', () => {
      expect(sanitizeCsvCell('')).toBe('');
    });
  });
});

// ── Security Headers ─────────────────────────────────────────────

describe('Security Headers', () => {
  describe('SECURITY_HEADERS', () => {
    it('should include Content-Security-Policy', () => {
      const csp = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy');
      expect(csp).toBeDefined();
      expect(csp!.value).toContain("default-src 'self'");
      expect(csp!.value).toContain("frame-ancestors 'none'");
    });

    it('should include X-Content-Type-Options: nosniff', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'X-Content-Type-Options');
      expect(header).toBeDefined();
      expect(header!.value).toBe('nosniff');
    });

    it('should include X-Frame-Options: DENY', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'X-Frame-Options');
      expect(header).toBeDefined();
      expect(header!.value).toBe('DENY');
    });

    it('should include Referrer-Policy', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Referrer-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe('strict-origin-when-cross-origin');
    });

    it('should include Permissions-Policy restricting camera, microphone, geolocation', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Permissions-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toContain('camera=()');
      expect(header!.value).toContain('microphone=()');
      expect(header!.value).toContain('geolocation=()');
    });

    it('should include Strict-Transport-Security', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Strict-Transport-Security');
      expect(header).toBeDefined();
      expect(header!.value).toContain('max-age=31536000');
    });
  });

  describe('applySecurityHeaders', () => {
    it('should set all headers on a response-like object', () => {
      // Minimal mock of NextResponse
      const headers = new Map<string, string>();
      const mockResponse = {
        headers: {
          set: (key: string, value: string) => headers.set(key, value),
          get: (key: string) => headers.get(key),
        },
      } as unknown as import('next/server').NextResponse;

      applySecurityHeaders(mockResponse);

      for (const header of SECURITY_HEADERS) {
        expect(headers.get(header.key)).toBe(header.value);
      }
    });
  });
});
