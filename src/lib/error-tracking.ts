import { logger } from '@/lib/logger';

interface ErrorContext {
  userId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

interface CapturedError {
  name: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
}

/**
 * Captures and logs structured error data.
 * Placeholder integration point for Sentry or similar services.
 */
export function captureError(error: unknown, context: ErrorContext = {}): CapturedError {
  const normalized = normalizeError(error);

  const captured: CapturedError = {
    name: normalized.name,
    message: normalized.message,
    stack: normalized.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error(captured.message, {
    ...context,
    errorName: normalized.name,
    stack: normalized.stack,
  });

  // Placeholder: send to external error tracking service
  // e.g., Sentry.captureException(error, { extra: context });

  return captured;
}

function normalizeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  if (typeof error === 'string') {
    return { name: 'Error', message: error };
  }

  return { name: 'UnknownError', message: String(error) };
}

/**
 * Global unhandled error handler for server-side use.
 * Call once during application bootstrap.
 */
export function installGlobalErrorHandlers(): void {
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error: Error) => {
      captureError(error, { action: 'uncaughtException' });
      // Allow the process to exit after logging
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      captureError(reason, { action: 'unhandledRejection' });
    });
  }
}

export type { ErrorContext, CapturedError };
