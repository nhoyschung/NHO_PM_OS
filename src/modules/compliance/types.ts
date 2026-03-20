import { z } from 'zod';

// ── Compliance Check Status ────────────────────────────────────────

export const ComplianceStatus = z.enum(['pass', 'fail', 'warning']);
export type ComplianceStatus = z.infer<typeof ComplianceStatus>;

// ── Compliance Check ───────────────────────────────────────────────

export interface ComplianceCheck {
  name: string;
  description: string;
  status: ComplianceStatus;
  details: string;
}

// ── Compliance Report ──────────────────────────────────────────────

export interface ComplianceReport {
  checks: ComplianceCheck[];
  passRate: number;
  timestamp: Date;
}
