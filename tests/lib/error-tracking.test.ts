import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureError } from '@/lib/error-tracking';

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('captureError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture an Error instance with name, message, and stack', () => {
    const error = new Error('something broke');
    const result = captureError(error);

    expect(result.name).toBe('Error');
    expect(result.message).toBe('something broke');
    expect(result.stack).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should capture a custom error class', () => {
    class NotFoundError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
      }
    }

    const error = new NotFoundError('user not found');
    const result = captureError(error, { userId: 'u-456' });

    expect(result.name).toBe('NotFoundError');
    expect(result.message).toBe('user not found');
    expect(result.context.userId).toBe('u-456');
  });

  it('should capture a string error', () => {
    const result = captureError('plain string error');

    expect(result.name).toBe('Error');
    expect(result.message).toBe('plain string error');
    expect(result.stack).toBeUndefined();
  });

  it('should capture an unknown error type', () => {
    const result = captureError(42);

    expect(result.name).toBe('UnknownError');
    expect(result.message).toBe('42');
  });

  it('should include context in the captured error', () => {
    const result = captureError(new Error('test'), {
      userId: 'u-789',
      requestId: 'req-001',
      action: 'createProject',
      metadata: { projectId: 'p-100' },
    });

    expect(result.context).toEqual({
      userId: 'u-789',
      requestId: 'req-001',
      action: 'createProject',
      metadata: { projectId: 'p-100' },
    });
  });

  it('should log the error via logger.error', async () => {
    const { logger } = await import('@/lib/logger');

    captureError(new Error('logged error'), { action: 'test' });

    expect(logger.error).toHaveBeenCalledWith(
      'logged error',
      expect.objectContaining({
        action: 'test',
        errorName: 'Error',
      }),
    );
  });

  it('should default to empty context', () => {
    const result = captureError(new Error('no context'));

    expect(result.context).toEqual({});
  });
});
