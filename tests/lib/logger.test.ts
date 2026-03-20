import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('development mode', () => {
    it('should output human-readable format in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.info('test message');

      expect(spy).toHaveBeenCalledOnce();
      const output = spy.mock.calls[0][0] as string;
      expect(output).toContain('INFO');
      expect(output).toContain('test message');
      // Development format is not JSON
      expect(() => JSON.parse(output)).toThrow();
    });

    it('should include context in development output', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.info('with context', { userId: 'u-123' });

      const output = spy.mock.calls[0][0] as string;
      expect(output).toContain('u-123');
    });

    it('should log debug messages in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.debug('debug message');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('DEBUG');
    });
  });

  describe('production mode', () => {
    it('should output JSON format in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.info('json test');

      expect(spy).toHaveBeenCalledOnce();
      const parsed = JSON.parse(spy.mock.calls[0][0] as string);
      expect(parsed).toMatchObject({
        level: 'info',
        message: 'json test',
      });
      expect(parsed.timestamp).toBeDefined();
    });

    it('should not log debug messages in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.debug('should not appear');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('should use console.error for error level', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.error('error message');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('ERROR');
    });

    it('should use console.warn for warn level', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      logger.warn('warning message');

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('WARN');
    });
  });
});
