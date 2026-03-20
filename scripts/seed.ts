import 'dotenv/config';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql, { schema });

// ── Seed Data (SOT: refs/ref-seed-data.md) ────────────────────────

const departmentData = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Ban Gi\u00e1m \u0111\u1ed1c',
    code: 'BGD',
    description: 'Ban \u0111i\u1ec1u h\u00e0nh v\u00e0 l\u00e3nh \u0111\u1ea1o c\u1ea5p cao',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Ph\u00f2ng C\u00f4ng ngh\u1ec7',
    code: 'TECH',
    description: 'Ph\u00e1t tri\u1ec3n ph\u1ea7n m\u1ec1m, h\u1ea1 t\u1ea7ng k\u1ef9 thu\u1eadt',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Ph\u00f2ng S\u1ea3n ph\u1ea9m',
    code: 'PROD',
    description: 'Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m, thi\u1ebft k\u1ebf UX/UI',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Ph\u00f2ng Kinh doanh',
    code: 'SALES',
    description: 'Kinh doanh, ph\u00e1t tri\u1ec3n kh\u00e1ch h\u00e0ng',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Ph\u00f2ng Nh\u00e2n s\u1ef1',
    code: 'HR',
    description: 'Qu\u1ea3n l\u00fd nh\u00e2n s\u1ef1, tuy\u1ec3n d\u1ee5ng, \u0111\u00e0o t\u1ea1o',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Ph\u00f2ng T\u00e0i ch\u00ednh',
    code: 'FIN',
    description: 'K\u1ebf to\u00e1n, t\u00e0i ch\u00ednh, ng\u00e2n s\u00e1ch',
    parentId: null,
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Ph\u00f2ng V\u1eadn h\u00e0nh',
    code: 'OPS',
    description: 'V\u1eadn h\u00e0nh h\u1ec7 th\u1ed1ng, h\u1ed7 tr\u1ee3 k\u1ef9 thu\u1eadt, b\u1ea3o m\u1eadt',
    parentId: null,
    isActive: true,
  },
];

const roleData = [
  {
    id: '00000000-0000-0000-0001-000000000001',
    name: 'admin',
    displayName: 'Qu\u1ea3n tr\u1ecb vi\u00ean',
    description: 'To\u00e0n quy\u1ec1n truy c\u1eadp h\u1ec7 th\u1ed1ng',
    level: 100,
    isSystem: true,
    isActive: true,
    permissions: {
      projects: { create: true, read: true, update: true, delete: true, manage_members: true, transition_stage: true },
      tasks: { create: true, read: true, update: true, delete: true, assign: true },
      handovers: { create: true, read: true, update: true, approve: true, reject: true },
      documents: { create: true, read: true, update: true, delete: true, approve: true },
      notifications: { read: true, manage_preferences: true },
      audit_logs: { read: true, export: true },
      financial_records: { create: true, read: true, update: true, approve: true, export: true },
      compliance: { create: true, read: true, update: true, assess: true },
      reports: { read: true, export: true },
      users: { create: true, read: true, update: true, delete: true, invite: true, assign_role: true },
      departments: { create: true, read: true, update: true, delete: true },
      settings: { read: true, update: true },
    },
  },
  {
    id: '00000000-0000-0000-0001-000000000002',
    name: 'manager',
    displayName: 'Qu\u1ea3n l\u00fd',
    description: 'Qu\u1ea3n l\u00fd c\u1ea5p ph\u00f2ng ban, gi\u00e1m s\u00e1t d\u1ef1 \u00e1n',
    level: 80,
    isSystem: true,
    isActive: true,
    permissions: {
      projects: { create: true, read: true, update: true, delete: false, manage_members: true, transition_stage: true },
      tasks: { create: true, read: true, update: true, delete: false, assign: true },
      handovers: { create: true, read: true, update: true, approve: true, reject: true },
      documents: { create: true, read: true, update: true, delete: false, approve: true },
      notifications: { read: true, manage_preferences: true },
      audit_logs: { read: true, export: true },
      financial_records: { create: true, read: true, update: true, approve: true, export: true },
      compliance: { create: true, read: true, update: true, assess: true },
      reports: { read: true, export: true },
      users: { create: false, read: true, update: false, delete: false, invite: true, assign_role: false },
      departments: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false },
    },
  },
  {
    id: '00000000-0000-0000-0001-000000000003',
    name: 'lead',
    displayName: 'Tr\u01b0\u1edfng nh\u00f3m',
    description: 'Tr\u01b0\u1edfng nh\u00f3m d\u1ef1 \u00e1n, gi\u00e1m s\u00e1t \u0111\u1ed9i ng\u0169',
    level: 60,
    isSystem: true,
    isActive: true,
    permissions: {
      projects: { create: false, read: true, update: true, delete: false, manage_members: true, transition_stage: true },
      tasks: { create: true, read: true, update: true, delete: false, assign: true },
      handovers: { create: true, read: true, update: true, approve: false, reject: false },
      documents: { create: true, read: true, update: true, delete: false, approve: false },
      notifications: { read: true, manage_preferences: true },
      audit_logs: { read: true, export: false },
      financial_records: { create: false, read: true, update: false, approve: false, export: false },
      compliance: { create: false, read: true, update: true, assess: false },
      reports: { read: true, export: false },
      users: { create: false, read: true, update: false, delete: false, invite: false, assign_role: false },
      departments: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false },
    },
  },
  {
    id: '00000000-0000-0000-0001-000000000004',
    name: 'member',
    displayName: 'Th\u00e0nh vi\u00ean',
    description: 'Th\u00e0nh vi\u00ean d\u1ef1 \u00e1n, th\u1ef1c hi\u1ec7n c\u00f4ng vi\u1ec7c',
    level: 40,
    isSystem: true,
    isActive: true,
    permissions: {
      projects: { create: false, read: true, update: false, delete: false, manage_members: false, transition_stage: false },
      tasks: { create: true, read: true, update: true, delete: false, assign: false },
      handovers: { create: false, read: true, update: false, approve: false, reject: false },
      documents: { create: true, read: true, update: true, delete: false, approve: false },
      notifications: { read: true, manage_preferences: true },
      audit_logs: { read: false, export: false },
      financial_records: { create: false, read: false, update: false, approve: false, export: false },
      compliance: { create: false, read: true, update: false, assess: false },
      reports: { read: false, export: false },
      users: { create: false, read: true, update: false, delete: false, invite: false, assign_role: false },
      departments: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false },
    },
  },
  {
    id: '00000000-0000-0000-0001-000000000005',
    name: 'viewer',
    displayName: 'Ng\u01b0\u1eddi xem',
    description: 'Ch\u1ec9 xem, kh\u00f4ng thao t\u00e1c',
    level: 20,
    isSystem: true,
    isActive: true,
    permissions: {
      projects: { create: false, read: true, update: false, delete: false, manage_members: false, transition_stage: false },
      tasks: { create: false, read: true, update: false, delete: false, assign: false },
      handovers: { create: false, read: true, update: false, approve: false, reject: false },
      documents: { create: false, read: true, update: false, delete: false, approve: false },
      notifications: { read: true, manage_preferences: true },
      audit_logs: { read: false, export: false },
      financial_records: { create: false, read: false, update: false, approve: false, export: false },
      compliance: { create: false, read: true, update: false, assess: false },
      reports: { read: false, export: false },
      users: { create: false, read: false, update: false, delete: false, invite: false, assign_role: false },
      departments: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false },
    },
  },
];

// Dev credentials (SOT: refs/ref-seed-data.md §8)
const DEV_PASSWORD = 'admin123456';

interface UserSeedInput {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  departmentId: string;
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  subscriptionTier?: 'free' | 'pro' | 'team' | 'enterprise';
  isActive: boolean;
  isVerified?: boolean;
  timezone?: string;
  locale?: string;
}

const userSeedData: UserSeedInput[] = [
  {
    id: '00000000-0000-0000-0002-000000000001',
    email: 'admin@projectopsos.local',
    fullName: 'System Admin',
    roleId: '00000000-0000-0000-0001-000000000001',
    departmentId: '00000000-0000-0000-0000-000000000001',
    subscriptionStatus: 'active',
    subscriptionTier: 'enterprise',
    isActive: true,
    isVerified: true,
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi',
  },
  {
    id: '00000000-0000-0000-0002-000000000002',
    email: 'manager@projectopsos.local',
    fullName: 'Nguy\u1ec5n V\u0103n Qu\u1ea3n',
    roleId: '00000000-0000-0000-0001-000000000002',
    departmentId: '00000000-0000-0000-0000-000000000002',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000003',
    email: 'lead@projectopsos.local',
    fullName: 'Tr\u1ea7n Th\u1ecb Linh',
    roleId: '00000000-0000-0000-0001-000000000003',
    departmentId: '00000000-0000-0000-0000-000000000002',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000004',
    email: 'member@projectopsos.local',
    fullName: 'L\u00ea Minh Tu\u1ea5n',
    roleId: '00000000-0000-0000-0001-000000000004',
    departmentId: '00000000-0000-0000-0000-000000000002',
    isActive: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000005',
    email: 'viewer@projectopsos.local',
    fullName: 'Ph\u1ea1m H\u1ed3ng Hoa',
    roleId: '00000000-0000-0000-0001-000000000005',
    departmentId: '00000000-0000-0000-0000-000000000004',
    isActive: true,
  },
];

const projectSeedData = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    name: 'H\u1ec7 th\u1ed1ng Qu\u1ea3n l\u00fd T\u00e0i li\u1ec7u N\u1ed9i b\u1ed9',
    code: 'PRJ-001',
    slug: 'he-thong-quan-ly-tai-lieu-noi-bo',
    description: 'X\u00e2y d\u1ef1ng h\u1ec7 th\u1ed1ng qu\u1ea3n l\u00fd t\u00e0i li\u1ec7u n\u1ed9i b\u1ed9 cho c\u00f4ng ty, bao g\u1ed3m ph\u00e2n lo\u1ea1i, phi\u00ean b\u1ea3n, v\u00e0 ph\u00e2n quy\u1ec1n truy c\u1eadp.',
    category: 'Internal Tool',
    priority: 'high' as const,
    stage: 'in_progress' as const,
    managerId: '00000000-0000-0000-0002-000000000002',
    departmentId: '00000000-0000-0000-0000-000000000002',
    teamLeadId: '00000000-0000-0000-0002-000000000003',
    startDate: '2026-01-15',
    endDate: '2026-04-30',
    budget: 50000000,
    budgetSpent: 15000000,
    currency: 'VND',
    progressPercentage: 35,
    healthStatus: 'on_track' as const,
    tags: ['n\u1ed9i b\u1ed9', 't\u00e0i li\u1ec7u', '\u01b0u ti\u00ean cao'],
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    name: 'N\u00e2ng c\u1ea5p H\u1ea1 t\u1ea7ng Cloud',
    code: 'PRJ-002',
    slug: 'nang-cap-ha-tang-cloud',
    description: 'Di chuy\u1ec3n h\u1ea1 t\u1ea7ng t\u1eeb on-premise sang cloud, t\u1ed1i \u01b0u hi\u1ec7u n\u0103ng v\u00e0 gi\u1ea3m chi ph\u00ed v\u1eadn h\u00e0nh.',
    category: 'Infrastructure',
    priority: 'critical' as const,
    stage: 'planning' as const,
    managerId: '00000000-0000-0000-0002-000000000001',
    departmentId: '00000000-0000-0000-0000-000000000007',
    teamLeadId: '00000000-0000-0000-0002-000000000003',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    budget: 200000000,
    budgetSpent: 0,
    currency: 'VND',
    progressPercentage: 10,
    healthStatus: 'on_track' as const,
    tags: ['h\u1ea1 t\u1ea7ng', 'cloud', 'nghi\u00eam tr\u1ecdng'],
  },
  {
    id: '00000000-0000-0000-0003-000000000003',
    name: '\u1ee8ng d\u1ee5ng Ch\u1ea5m c\u00f4ng Mobile',
    code: 'PRJ-003',
    slug: 'ung-dung-cham-cong-mobile',
    description: 'Ph\u00e1t tri\u1ec3n \u1ee9ng d\u1ee5ng ch\u1ea5m c\u00f4ng tr\u00ean \u0111i\u1ec7n tho\u1ea1i cho nh\u00e2n vi\u00ean, t\u00edch h\u1ee3p GPS v\u00e0 nh\u1eadn di\u1ec7n khu\u00f4n m\u1eb7t.',
    category: 'Mobile App',
    priority: 'medium' as const,
    stage: 'review' as const,
    managerId: '00000000-0000-0000-0002-000000000002',
    departmentId: '00000000-0000-0000-0000-000000000005',
    teamLeadId: '00000000-0000-0000-0002-000000000003',
    startDate: '2025-11-01',
    endDate: '2026-03-31',
    budget: 80000000,
    budgetSpent: 60000000,
    currency: 'VND',
    progressPercentage: 75,
    healthStatus: 'at_risk' as const,
    tags: ['mobile', 'nh\u00e2n s\u1ef1', 'ch\u1ea5m c\u00f4ng'],
  },
];

const taskSeedData = [
  {
    projectId: '00000000-0000-0000-0003-000000000001',
    title: 'Thi\u1ebft k\u1ebf database schema',
    code: 'TSK-001',
    type: 'feature' as const,
    priority: 'high' as const,
    status: 'done' as const,
    assigneeId: '00000000-0000-0000-0002-000000000004',
    reporterId: '00000000-0000-0000-0002-000000000003',
    estimatedHours: 16,
    actualHours: 20,
    acceptanceCriteria: [
      'Schema bao g\u1ed3m t\u1ea5t c\u1ea3 b\u1ea3ng c\u1ea7n thi\u1ebft',
      'Indexes cho c\u00e1c tr\u01b0\u1eddng t\u00ecm ki\u1ebfm',
      'RLS policies cho m\u1ecdi b\u1ea3ng',
    ],
  },
  {
    projectId: '00000000-0000-0000-0003-000000000001',
    title: 'Ph\u00e1t tri\u1ec3n API upload t\u00e0i li\u1ec7u',
    code: 'TSK-002',
    type: 'feature' as const,
    priority: 'high' as const,
    status: 'in_progress' as const,
    assigneeId: '00000000-0000-0000-0002-000000000004',
    reporterId: '00000000-0000-0000-0002-000000000003',
    estimatedHours: 24,
    dueDate: '2026-03-25',
    acceptanceCriteria: [
      'Upload file t\u1ed1i \u0111a 50MB',
      'H\u1ed7 tr\u1ee3 PDF, DOCX, XLSX',
      'T\u1ef1 \u0111\u1ed9ng ph\u00e1t hi\u1ec7n virus',
    ],
  },
  {
    projectId: '00000000-0000-0000-0003-000000000001',
    title: 'T\u1ea1o giao di\u1ec7n danh s\u00e1ch t\u00e0i li\u1ec7u',
    code: 'TSK-003',
    type: 'feature' as const,
    priority: 'medium' as const,
    status: 'todo' as const,
    assigneeId: '00000000-0000-0000-0002-000000000004',
    reporterId: '00000000-0000-0000-0002-000000000003',
    estimatedHours: 16,
    acceptanceCriteria: [
      'Ph\u00e2n trang 20 items/trang',
      'B\u1ed9 l\u1ecdc theo lo\u1ea1i, tr\u1ea1ng th\u00e1i',
      'T\u00ecm ki\u1ebfm theo ti\u00eau \u0111\u1ec1',
    ],
  },
];

// ── Seed Functions ────────────────────────────────────────────────

async function seedDepartments(): Promise<number> {
  let created = 0;
  for (const dept of departmentData) {
    const existing = await db
      .select({ id: schema.departments.id })
      .from(schema.departments)
      .where(eq(schema.departments.id, dept.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.departments).values(dept);
      created++;
    }
  }
  return created;
}

async function seedRoles(): Promise<number> {
  let created = 0;
  for (const role of roleData) {
    const existing = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, role.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.roles).values(role);
      created++;
    }
  }
  return created;
}

async function seedUsers(): Promise<number> {
  const passwordHash = await hash(DEV_PASSWORD, 12);
  let created = 0;

  for (const user of userSeedData) {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.users).values({
        ...user,
        passwordHash,
        isVerified: user.isVerified ?? false,
        subscriptionStatus: user.subscriptionStatus ?? 'incomplete',
        subscriptionTier: user.subscriptionTier ?? 'free',
        timezone: user.timezone ?? 'Asia/Ho_Chi_Minh',
        locale: user.locale ?? 'vi',
      });
      created++;
    }
  }
  return created;
}

async function seedProjects(): Promise<number> {
  let created = 0;
  for (const project of projectSeedData) {
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

async function seedTasks(): Promise<number> {
  let created = 0;
  for (const task of taskSeedData) {
    const existing = await db
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(eq(schema.tasks.code, task.code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.tasks).values(task);
      created++;
    }
  }
  return created;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...\n');

  const deptCount = await seedDepartments();
  console.log(`  Departments: ${deptCount} created (${departmentData.length} total)`);

  const roleCount = await seedRoles();
  console.log(`  Roles:       ${roleCount} created (${roleData.length} total)`);

  const userCount = await seedUsers();
  console.log(`  Users:       ${userCount} created (${userSeedData.length} total)`);

  const projCount = await seedProjects();
  console.log(`  Projects:    ${projCount} created (${projectSeedData.length} total)`);

  const taskCount = await seedTasks();
  console.log(`  Tasks:       ${taskCount} created (${taskSeedData.length} total)`);

  console.log('\nSeed complete!');
  console.log(`  Total new records: ${deptCount + roleCount + userCount + projCount + taskCount}`);

  await sql.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
