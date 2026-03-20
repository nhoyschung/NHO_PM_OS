# Reference: Seed Data

> **SOT** for initial seed data loaded into the database. Provides working data for development and testing.

---

## 1. Departments (7 departments)

```typescript
const departments = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Ban Giám đốc',
    code: 'BGD',
    description: 'Ban điều hành và lãnh đạo cấp cao',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Phòng Công nghệ',
    code: 'TECH',
    description: 'Phát triển phần mềm, hạ tầng kỹ thuật',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Phòng Sản phẩm',
    code: 'PROD',
    description: 'Quản lý sản phẩm, thiết kế UX/UI',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Phòng Kinh doanh',
    code: 'SALES',
    description: 'Kinh doanh, phát triển khách hàng',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Phòng Nhân sự',
    code: 'HR',
    description: 'Quản lý nhân sự, tuyển dụng, đào tạo',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Phòng Tài chính',
    code: 'FIN',
    description: 'Kế toán, tài chính, ngân sách',
    parent_id: null,
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Phòng Vận hành',
    code: 'OPS',
    description: 'Vận hành hệ thống, hỗ trợ kỹ thuật, bảo mật',
    parent_id: null,
    is_active: true,
  },
];
```

### Department Hierarchy (Vietnamese names with English annotations)

| Department | Code | Translation | Purpose |
|-----------|------|-------------|---------|
| Ban Giám đốc | BGD | Executive Board | Top-level management and leadership |
| Phòng Công nghệ | TECH | Technology | Software development, technical infrastructure |
| Phòng Sản phẩm | PROD | Product | Product management, UX/UI design |
| Phòng Kinh doanh | SALES | Sales/Business | Sales, business development |
| Phòng Nhân sự | HR | Human Resources | HR management, recruitment, training |
| Phòng Tài chính | FIN | Finance | Accounting, finance, budgeting |
| Phòng Vận hành | OPS | Operations | System operations, technical support, security |

---

## 2. Roles (5 system roles)

```typescript
const roles = [
  {
    id: '00000000-0000-0000-0001-000000000001',
    name: 'admin',
    display_name: 'Quản trị viên',
    description: 'Toàn quyền truy cập hệ thống',
    level: 100,
    is_system: true,
    is_active: true,
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
    display_name: 'Quản lý',
    description: 'Quản lý cấp phòng ban, giám sát dự án',
    level: 80,
    is_system: true,
    is_active: true,
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
    display_name: 'Trưởng nhóm',
    description: 'Trưởng nhóm dự án, giám sát đội ngũ',
    level: 60,
    is_system: true,
    is_active: true,
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
    display_name: 'Thành viên',
    description: 'Thành viên dự án, thực hiện công việc',
    level: 40,
    is_system: true,
    is_active: true,
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
    display_name: 'Người xem',
    description: 'Chỉ xem, không thao tác',
    level: 20,
    is_system: true,
    is_active: true,
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
```

---

## 3. Admin User

```typescript
const adminUser = {
  id: '00000000-0000-0000-0002-000000000001',
  email: 'admin@projectopsos.local',
  full_name: 'System Admin',
  role_id: '00000000-0000-0000-0001-000000000001', // admin role
  department_id: '00000000-0000-0000-0000-000000000001', // BGD
  subscription_status: 'active',
  subscription_tier: 'enterprise',
  is_active: true,
  is_verified: true,
  timezone: 'Asia/Ho_Chi_Minh',
  locale: 'vi',
};
// Password set via Supabase Auth: admin123456 (development only)
```

---

## 4. Sample Users (for development)

```typescript
const sampleUsers = [
  {
    id: '00000000-0000-0000-0002-000000000002',
    email: 'manager@projectopsos.local',
    full_name: 'Nguyễn Văn Quản',
    role_id: '00000000-0000-0000-0001-000000000002', // manager
    department_id: '00000000-0000-0000-0000-000000000002', // TECH
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000003',
    email: 'lead@projectopsos.local',
    full_name: 'Trần Thị Linh',
    role_id: '00000000-0000-0000-0001-000000000003', // lead
    department_id: '00000000-0000-0000-0000-000000000002', // TECH
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000004',
    email: 'member@projectopsos.local',
    full_name: 'Lê Minh Tuấn',
    role_id: '00000000-0000-0000-0001-000000000004', // member
    department_id: '00000000-0000-0000-0000-000000000002', // TECH
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0002-000000000005',
    email: 'viewer@projectopsos.local',
    full_name: 'Phạm Hồng Hoa',
    role_id: '00000000-0000-0000-0001-000000000005', // viewer
    department_id: '00000000-0000-0000-0000-000000000004', // SALES
    is_active: true,
  },
];
```

---

## 5. Sample Projects (3 projects at different stages)

```typescript
const sampleProjects = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    name: 'Hệ thống Quản lý Tài liệu Nội bộ',
    code: 'PRJ-001',
    slug: 'he-thong-quan-ly-tai-lieu-noi-bo',
    description: 'Xây dựng hệ thống quản lý tài liệu nội bộ cho công ty, bao gồm phân loại, phiên bản, và phân quyền truy cập.',
    category: 'Internal Tool',
    priority: 'high',
    stage: 'in_progress',
    owner_id: '00000000-0000-0000-0002-000000000002', // manager
    department_id: '00000000-0000-0000-0000-000000000002', // TECH
    team_lead_id: '00000000-0000-0000-0002-000000000003', // lead
    start_date: '2026-01-15',
    target_end_date: '2026-04-30',
    budget_allocated: 50000000, // 50,000,000 VND (in cents/smallest unit)
    budget_spent: 15000000,
    currency: 'VND',
    progress_percentage: 35,
    health_status: 'on_track',
    tags: ['nội bộ', 'tài liệu', 'ưu tiên cao'],
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    name: 'Nâng cấp Hạ tầng Cloud',
    code: 'PRJ-002',
    slug: 'nang-cap-ha-tang-cloud',
    description: 'Di chuyển hạ tầng từ on-premise sang cloud, tối ưu hiệu năng và giảm chi phí vận hành.',
    category: 'Infrastructure',
    priority: 'critical',
    stage: 'planning',
    owner_id: '00000000-0000-0000-0002-000000000001', // admin
    department_id: '00000000-0000-0000-0000-000000000007', // OPS
    team_lead_id: '00000000-0000-0000-0002-000000000003', // lead
    start_date: '2026-03-01',
    target_end_date: '2026-08-31',
    budget_allocated: 200000000, // 200M VND
    budget_spent: 0,
    currency: 'VND',
    progress_percentage: 10,
    health_status: 'on_track',
    tags: ['hạ tầng', 'cloud', 'nghiêm trọng'],
  },
  {
    id: '00000000-0000-0000-0003-000000000003',
    name: 'Ứng dụng Chấm công Mobile',
    code: 'PRJ-003',
    slug: 'ung-dung-cham-cong-mobile',
    description: 'Phát triển ứng dụng chấm công trên điện thoại cho nhân viên, tích hợp GPS và nhận diện khuôn mặt.',
    category: 'Mobile App',
    priority: 'medium',
    stage: 'review',
    owner_id: '00000000-0000-0000-0002-000000000002', // manager
    department_id: '00000000-0000-0000-0000-000000000005', // HR
    team_lead_id: '00000000-0000-0000-0002-000000000003', // lead
    start_date: '2025-11-01',
    target_end_date: '2026-03-31',
    budget_allocated: 80000000, // 80M VND
    budget_spent: 60000000,
    currency: 'VND',
    progress_percentage: 75,
    health_status: 'at_risk',
    tags: ['mobile', 'nhân sự', 'chấm công'],
  },
];
```

---

## 6. Sample Tasks

```typescript
const sampleTasks = [
  {
    project_id: '00000000-0000-0000-0003-000000000001', // PRJ-001
    title: 'Thiết kế database schema',
    code: 'TSK-001',
    type: 'feature',
    priority: 'high',
    status: 'done',
    assignee_id: '00000000-0000-0000-0002-000000000004', // member
    reporter_id: '00000000-0000-0000-0002-000000000003', // lead
    estimated_hours: 16,
    actual_hours: 20,
    acceptance_criteria: [
      'Schema bao gồm tất cả bảng cần thiết',
      'Indexes cho các trường tìm kiếm',
      'RLS policies cho mọi bảng',
    ],
  },
  {
    project_id: '00000000-0000-0000-0003-000000000001', // PRJ-001
    title: 'Phát triển API upload tài liệu',
    code: 'TSK-002',
    type: 'feature',
    priority: 'high',
    status: 'in_progress',
    assignee_id: '00000000-0000-0000-0002-000000000004', // member
    reporter_id: '00000000-0000-0000-0002-000000000003', // lead
    estimated_hours: 24,
    due_date: '2026-03-25',
    acceptance_criteria: [
      'Upload file tối đa 50MB',
      'Hỗ trợ PDF, DOCX, XLSX',
      'Tự động phát hiện virus',
    ],
  },
  {
    project_id: '00000000-0000-0000-0003-000000000001', // PRJ-001
    title: 'Tạo giao diện danh sách tài liệu',
    code: 'TSK-003',
    type: 'feature',
    priority: 'medium',
    status: 'todo',
    assignee_id: '00000000-0000-0000-0002-000000000004', // member
    reporter_id: '00000000-0000-0000-0002-000000000003', // lead
    estimated_hours: 16,
    acceptance_criteria: [
      'Phân trang 20 items/trang',
      'Bộ lọc theo loại, trạng thái',
      'Tìm kiếm theo tiêu đề',
    ],
  },
];
```

---

## 7. Seed Script Structure

```typescript
// lib/db/seed.ts
import { db } from './index';
import { departments, roles, users, projects, tasks } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Departments (no dependencies)
  await db.insert(departments).values(departmentData).onConflictDoNothing();
  console.log('✓ Departments seeded');

  // 2. Roles (no dependencies)
  await db.insert(roles).values(roleData).onConflictDoNothing();
  console.log('✓ Roles seeded');

  // 3. Users (depends on departments, roles)
  // Note: Must create in Supabase Auth first, then insert app user record
  await db.insert(users).values(userData).onConflictDoNothing();
  console.log('✓ Users seeded');

  // 4. Projects (depends on users, departments)
  await db.insert(projects).values(projectData).onConflictDoNothing();
  console.log('✓ Projects seeded');

  // 5. Tasks (depends on projects, users)
  await db.insert(tasks).values(taskData).onConflictDoNothing();
  console.log('✓ Tasks seeded');

  console.log('🌱 Seeding complete!');
}

seed().catch(console.error);
```

### Seed Execution Order

1. **departments** — no dependencies
2. **roles** — no dependencies
3. **users** — depends on departments, roles
4. **projects** — depends on users, departments
5. **project_members** — depends on projects, users
6. **tasks** — depends on projects, users
7. **handovers** — depends on projects, users (optional seed)
8. **documents** — depends on projects, users (optional seed)

---

## 8. Development Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@projectopsos.local | admin123456 | admin |
| Manager | manager@projectopsos.local | manager123456 | manager |
| Lead | lead@projectopsos.local | lead123456 | lead |
| Member | member@projectopsos.local | member123456 | member |
| Viewer | viewer@projectopsos.local | viewer123456 | viewer |

> **WARNING**: These credentials are for local development ONLY. Never use in production.

---

*Source: PRD v1.0 §6*
