/**
 * seed-projects.ts — Project-specific seed data enhancement
 *
 * Adds 9 additional Vietnamese construction/infrastructure projects
 * covering all 10 project stages (combined with seed.ts PRJ-001..003).
 *
 * Usage: pnpm exec tsx scripts/seed-projects.ts
 * Requires: DATABASE_URL environment variable
 * Idempotent: safe to run multiple times (checks by ID before insert).
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });

// ── User IDs (from ref-seed-data.md) ────────────────────────────
const ADMIN_ID = '00000000-0000-0000-0002-000000000001';
const MANAGER_ID = '00000000-0000-0000-0002-000000000002';
const LEAD_ID = '00000000-0000-0000-0002-000000000003';
const MEMBER_ID = '00000000-0000-0000-0002-000000000004';

// ── Department IDs (from ref-seed-data.md) ──────────────────────
const DEPT_TECH = '00000000-0000-0000-0000-000000000002';
const DEPT_PROD = '00000000-0000-0000-0000-000000000003';
const DEPT_HR = '00000000-0000-0000-0000-000000000005';
const DEPT_FIN = '00000000-0000-0000-0000-000000000006';
const DEPT_OPS = '00000000-0000-0000-0000-000000000007';

// ── Additional Project Seed Data ────────────────────────────────
// 9 Vietnamese construction/infrastructure projects with varied attributes.
// Uses actual PROVINCES values from constants.ts.
// Combined with seed.ts (PRJ-001: in_progress, PRJ-002: planning, PRJ-003: review),
// this dataset covers all 10 project stages.

const additionalProjects = [
  {
    id: '00000000-0000-0000-0003-000000000004',
    name: 'Xây dựng Cầu Nhật Tân mở rộng',
    code: 'PRJ-004',
    slug: 'xay-dung-cau-nhat-tan-mo-rong',
    description: 'Mở rộng cầu Nhật Tân thêm 2 làn xe, nâng cao năng lực vận tải giữa Hà Nội và sân bay Nội Bài.',
    category: 'Infrastructure',
    priority: 'critical' as const,
    stage: 'in_progress' as const,
    managerId: ADMIN_ID,
    departmentId: DEPT_OPS,
    teamLeadId: LEAD_ID,
    province: 'HN',
    startDate: '2026-02-01',
    endDate: '2027-06-30',
    budget: 1200000000,
    budgetSpent: 350000000,
    currency: 'VND',
    progressPercentage: 28,
    healthStatus: 'on_track' as const,
    tags: ['cầu đường', 'hạ tầng', 'Hà Nội'],
  },
  {
    id: '00000000-0000-0000-0003-000000000005',
    name: 'Trung tâm Dữ liệu Đà Nẵng',
    code: 'PRJ-005',
    slug: 'trung-tam-du-lieu-da-nang',
    description: 'Xây dựng trung tâm dữ liệu Tier-3 phục vụ chuyển đổi số cho khu vực miền Trung.',
    category: 'Data Center',
    priority: 'high' as const,
    stage: 'planning' as const,
    managerId: MANAGER_ID,
    departmentId: DEPT_TECH,
    teamLeadId: LEAD_ID,
    province: 'DN',
    startDate: '2026-04-15',
    endDate: '2027-12-31',
    budget: 800000000,
    budgetSpent: 0,
    currency: 'VND',
    progressPercentage: 5,
    healthStatus: 'on_track' as const,
    tags: ['trung tâm dữ liệu', 'Đà Nẵng', 'chuyển đổi số'],
  },
  {
    id: '00000000-0000-0000-0003-000000000006',
    name: 'Khu Công nghiệp Xanh Bình Dương',
    code: 'PRJ-006',
    slug: 'khu-cong-nghiep-xanh-binh-duong',
    description: 'Phát triển khu công nghiệp xanh với hệ thống xử lý nước thải và năng lượng mặt trời.',
    category: 'Industrial',
    priority: 'medium' as const,
    stage: 'testing' as const,
    managerId: ADMIN_ID,
    departmentId: DEPT_OPS,
    teamLeadId: LEAD_ID,
    province: 'BD',
    startDate: '2025-08-01',
    endDate: '2026-12-31',
    budget: 500000000,
    budgetSpent: 360000000,
    currency: 'VND',
    progressPercentage: 72,
    healthStatus: 'at_risk' as const,
    tags: ['công nghiệp', 'xanh', 'Bình Dương'],
  },
  {
    id: '00000000-0000-0000-0003-000000000007',
    name: 'Hệ thống Thoát nước TP.HCM Giai đoạn 3',
    code: 'PRJ-007',
    slug: 'he-thong-thoat-nuoc-tphcm-gd3',
    description: 'Nâng cấp hệ thống thoát nước chống ngập cho các quận trung tâm TP. Hồ Chí Minh.',
    category: 'Infrastructure',
    priority: 'critical' as const,
    stage: 'deployment' as const,
    managerId: MANAGER_ID,
    departmentId: DEPT_OPS,
    teamLeadId: LEAD_ID,
    province: 'HCM',
    startDate: '2025-03-01',
    endDate: '2026-09-30',
    budget: 600000000,
    budgetSpent: 520000000,
    currency: 'VND',
    progressPercentage: 88,
    healthStatus: 'on_track' as const,
    tags: ['thoát nước', 'chống ngập', 'HCM'],
  },
  {
    id: '00000000-0000-0000-0003-000000000008',
    name: 'Phần mềm Quản lý Tài chính Doanh nghiệp',
    code: 'PRJ-008',
    slug: 'phan-mem-quan-ly-tai-chinh-dn',
    description: 'Phát triển phần mềm ERP quản lý tài chính nội bộ, tích hợp thanh toán và hóa đơn điện tử.',
    category: 'Software',
    priority: 'high' as const,
    stage: 'staging' as const,
    managerId: MANAGER_ID,
    departmentId: DEPT_FIN,
    teamLeadId: LEAD_ID,
    province: 'HN',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    budget: 150000000,
    budgetSpent: 120000000,
    currency: 'VND',
    progressPercentage: 80,
    healthStatus: 'on_track' as const,
    tags: ['ERP', 'tài chính', 'phần mềm'],
  },
  {
    id: '00000000-0000-0000-0003-000000000009',
    name: 'Cảng Biển Quốc tế Hải Phòng mở rộng',
    code: 'PRJ-009',
    slug: 'cang-bien-quoc-te-hai-phong-mo-rong',
    description: 'Mở rộng bến cảng container quốc tế, nâng công suất xếp dỡ lên 5 triệu TEU/năm.',
    category: 'Port Infrastructure',
    priority: 'critical' as const,
    stage: 'initiation' as const,
    managerId: ADMIN_ID,
    departmentId: DEPT_OPS,
    teamLeadId: null,
    province: 'HP',
    startDate: '2026-07-01',
    endDate: '2029-12-31',
    budget: 2000000000,
    budgetSpent: 0,
    currency: 'VND',
    progressPercentage: 0,
    healthStatus: 'on_track' as const,
    tags: ['cảng biển', 'Hải Phòng', 'quốc tế'],
  },
  {
    id: '00000000-0000-0000-0003-000000000010',
    name: 'Đường cao tốc Cần Thơ - Cà Mau',
    code: 'PRJ-010',
    slug: 'duong-cao-toc-can-tho-ca-mau',
    description: 'Xây dựng 120km đường cao tốc 4 làn xe nối Cần Thơ với Cà Mau, phục vụ phát triển đồng bằng sông Cửu Long.',
    category: 'Highway',
    priority: 'high' as const,
    stage: 'completed' as const,
    managerId: ADMIN_ID,
    departmentId: DEPT_OPS,
    teamLeadId: LEAD_ID,
    province: 'CT',
    startDate: '2024-01-01',
    endDate: '2026-01-31',
    budget: 1500000000,
    budgetSpent: 1440000000,
    currency: 'VND',
    progressPercentage: 100,
    healthStatus: 'on_track' as const,
    tags: ['cao tốc', 'Cần Thơ', 'ĐBSCL'],
  },
  // ── Stage coverage: monitoring ──
  {
    id: '00000000-0000-0000-0003-000000000011',
    name: 'Hệ thống Giám sát Giao thông Thông minh Đà Nẵng',
    code: 'PRJ-011',
    slug: 'he-thong-giam-sat-giao-thong-da-nang',
    description: 'Triển khai 500 camera AI và trung tâm điều khiển giao thông thông minh cho thành phố Đà Nẵng.',
    category: 'Smart City',
    priority: 'high' as const,
    stage: 'monitoring' as const,
    managerId: MANAGER_ID,
    departmentId: DEPT_TECH,
    teamLeadId: LEAD_ID,
    province: 'DN',
    startDate: '2025-06-01',
    endDate: '2026-06-30',
    budget: 450000000,
    budgetSpent: 420000000,
    currency: 'VND',
    progressPercentage: 95,
    healthStatus: 'on_track' as const,
    tags: ['giao thông', 'AI', 'Đà Nẵng', 'smart city'],
  },
  // ── Stage coverage: handover ──
  {
    id: '00000000-0000-0000-0003-000000000012',
    name: 'Nhà máy Xử lý Nước thải Khu đô thị Thủ Thiêm',
    code: 'PRJ-012',
    slug: 'nha-may-xu-ly-nuoc-thai-thu-thiem',
    description: 'Xây dựng nhà máy xử lý nước thải công suất 150.000 m3/ngày phục vụ khu đô thị mới Thủ Thiêm.',
    category: 'Environmental',
    priority: 'medium' as const,
    stage: 'handover' as const,
    managerId: ADMIN_ID,
    departmentId: DEPT_OPS,
    teamLeadId: LEAD_ID,
    province: 'HCM',
    startDate: '2024-09-01',
    endDate: '2026-03-31',
    budget: 900000000,
    budgetSpent: 880000000,
    currency: 'VND',
    progressPercentage: 98,
    healthStatus: 'on_track' as const,
    tags: ['nước thải', 'Thủ Thiêm', 'môi trường'],
  },
];

// ── Project Members (link users to projects) ────────────────────
// Each additional project gets at least 2 members.
const projectMembersData = [
  // PRJ-004: Cầu Nhật Tân
  { projectId: '00000000-0000-0000-0003-000000000004', userId: ADMIN_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000004', userId: LEAD_ID, role: 'lead' as const },
  { projectId: '00000000-0000-0000-0003-000000000004', userId: MEMBER_ID, role: 'member' as const },
  // PRJ-005: Trung tâm Dữ liệu
  { projectId: '00000000-0000-0000-0003-000000000005', userId: MANAGER_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000005', userId: LEAD_ID, role: 'lead' as const },
  // PRJ-006: Khu Công nghiệp Xanh
  { projectId: '00000000-0000-0000-0003-000000000006', userId: ADMIN_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000006', userId: LEAD_ID, role: 'lead' as const },
  { projectId: '00000000-0000-0000-0003-000000000006', userId: MEMBER_ID, role: 'member' as const },
  // PRJ-007: Thoát nước TP.HCM
  { projectId: '00000000-0000-0000-0003-000000000007', userId: MANAGER_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000007', userId: LEAD_ID, role: 'lead' as const },
  // PRJ-008: Phần mềm Tài chính
  { projectId: '00000000-0000-0000-0003-000000000008', userId: MANAGER_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000008', userId: LEAD_ID, role: 'lead' as const },
  { projectId: '00000000-0000-0000-0003-000000000008', userId: MEMBER_ID, role: 'member' as const },
  // PRJ-009: Cảng Biển Hải Phòng
  { projectId: '00000000-0000-0000-0003-000000000009', userId: ADMIN_ID, role: 'owner' as const },
  // PRJ-010: Cao tốc Cần Thơ
  { projectId: '00000000-0000-0000-0003-000000000010', userId: ADMIN_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000010', userId: LEAD_ID, role: 'lead' as const },
  // PRJ-011: Giám sát Giao thông
  { projectId: '00000000-0000-0000-0003-000000000011', userId: MANAGER_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000011', userId: LEAD_ID, role: 'lead' as const },
  { projectId: '00000000-0000-0000-0003-000000000011', userId: MEMBER_ID, role: 'member' as const },
  // PRJ-012: Nhà máy Nước thải
  { projectId: '00000000-0000-0000-0003-000000000012', userId: ADMIN_ID, role: 'owner' as const },
  { projectId: '00000000-0000-0000-0003-000000000012', userId: LEAD_ID, role: 'lead' as const },
];

// ── Seed Functions ──────────────────────────────────────────────

async function seedAdditionalProjects(): Promise<number> {
  let created = 0;
  for (const project of additionalProjects) {
    const existing = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.id, project.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.projects).values(project);
      created++;
    }
  }
  return created;
}

async function seedProjectMembers(): Promise<number> {
  let created = 0;
  for (const member of projectMembersData) {
    try {
      await db.insert(schema.projectMembers).values(member);
      created++;
    } catch (err: unknown) {
      // Unique constraint violation (project_id, user_id) = already exists, skip
      // DrizzleQueryError wraps PostgresError; check both message and cause
      const errObj = err as { message?: string; cause?: { code?: string } };
      const isUniqueViolation =
        errObj.cause?.code === '23505' ||
        (errObj.message ?? '').includes('unique');
      if (!isUniqueViolation) {
        throw err;
      }
    }
  }
  return created;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding additional projects...\n');

  const projCount = await seedAdditionalProjects();
  console.log(`  Projects: ${projCount} created (${additionalProjects.length} defined)`);

  const memberCount = await seedProjectMembers();
  console.log(`  Project members: ${memberCount} created (${projectMembersData.length} defined)`);

  // Summary
  const totalProjects = await db
    .select({ id: schema.projects.id })
    .from(schema.projects);
  console.log(`\n  Total projects in DB: ${totalProjects.length}`);

  const stages = await db
    .select({ stage: schema.projects.stage })
    .from(schema.projects);
  const uniqueStages = [...new Set(stages.map((s) => s.stage))].sort();
  console.log(`  Stages covered: ${uniqueStages.join(', ')} (${uniqueStages.length}/10)`);

  console.log('\nProject seed complete!');
  await sql.end();
}

main().catch((err) => {
  console.error('Project seed failed:', err);
  process.exit(1);
});
