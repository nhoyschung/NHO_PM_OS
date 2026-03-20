import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind CSS classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a Date for Vietnamese locale (dd/MM/yyyy). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Format a number as Vietnamese Dong currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/** Generate a UUID v4 string. */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Relaxed UUID regex — accepts any 8-4-4-4-12 hex pattern.
 * Zod v4's built-in .uuid() enforces RFC 4122 variant bits,
 * which rejects seed/test UUIDs like 00000000-0000-0000-0000-000000000001.
 * Use this with z.string().regex(UUID_REGEX) instead of z.string().uuid().
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
