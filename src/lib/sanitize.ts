// ── Input Sanitization ───────────────────────────────────────────
// Defensive sanitization for user-supplied content.
// These are supplementary guards; primary validation uses Zod schemas.

/**
 * Strip HTML tags from user input to prevent XSS via stored content.
 * Preserves plain text content between tags.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<') // Decode common entities for re-encoding
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[<>"'&]/g, (char) => {
      // Re-encode potentially dangerous characters
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] ?? char;
    });
}

/**
 * Clean a filename for safe storage.
 * Removes path traversal sequences, null bytes, and non-safe characters.
 * Preserves the file extension.
 */
export function sanitizeFilename(name: string): string {
  let cleaned = name
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path traversal
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    // Remove leading dots (hidden files)
    .replace(/^\.+/, '')
    // Remove non-safe characters (keep alphanumeric, hyphens, underscores, dots, spaces)
    .replace(/[^a-zA-Z0-9\-_.\s]/g, '')
    // Collapse multiple dots
    .replace(/\.{2,}/g, '.')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If everything was stripped, return a safe default
  if (!cleaned || cleaned === '.') {
    return 'unnamed-file';
  }

  // Enforce maximum length (255 chars is typical filesystem limit)
  const MAX_FILENAME_LENGTH = 255;
  if (cleaned.length > MAX_FILENAME_LENGTH) {
    const ext = cleaned.lastIndexOf('.');
    if (ext > 0) {
      const extension = cleaned.slice(ext);
      cleaned = cleaned.slice(0, MAX_FILENAME_LENGTH - extension.length) + extension;
    } else {
      cleaned = cleaned.slice(0, MAX_FILENAME_LENGTH);
    }
  }

  return cleaned;
}

/**
 * Validate that a CSV content string does not contain formula injection payloads.
 * Returns the sanitized string with leading formula characters escaped.
 */
export function sanitizeCsvCell(value: string): string {
  // Prevent CSV formula injection: prefix dangerous first characters with a single quote
  const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];
  if (FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return `'${value}`;
  }
  return value;
}
