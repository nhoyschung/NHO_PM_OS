import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Package version from build time
const APP_VERSION = process.env.npm_package_version ?? '0.1.0';
const startTime = Date.now();

async function checkDatabase(): Promise<{ status: 'ok' | 'error'; latencyMs: number }> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const dbCheck = await checkDatabase();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const isHealthy = dbCheck.status === 'ok';

  const body = {
    status: isHealthy ? 'ok' : 'degraded',
    db: dbCheck,
    uptime: uptimeSeconds,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  };

  if (!isHealthy) {
    logger.warn('Health check: database unreachable', { dbLatencyMs: dbCheck.latencyMs });
  }

  return NextResponse.json(body, { status: isHealthy ? 200 : 503 });
}
