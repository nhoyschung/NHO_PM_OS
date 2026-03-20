import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import {
  subscriptionStatusEnum,
  subscriptionTierEnum,
  deviceTypeEnum,
  invitationStatusEnum,
} from './enums';

// ── 1. Users (Người dùng) ─────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    // Primary key — matches Supabase Auth uid
    id: uuid('id').primaryKey().notNull(),

    // Profile (Hồ sơ)
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),

    // Organization (Tổ chức)
    departmentId: uuid('department_id'),
    roleId: uuid('role_id').notNull(),

    // Billing (Thanh toán)
    stripeCustomerId: text('stripe_customer_id').unique(),
    subscriptionStatus: subscriptionStatusEnum('subscription_status').default('incomplete'),
    subscriptionTier: subscriptionTierEnum('subscription_tier').default('free'),

    // Preferences (Tùy chọn)
    preferences: jsonb('preferences').default({}),
    timezone: text('timezone').default('UTC'),
    locale: text('locale').default('en'),

    // Status (Trạng thái)
    isActive: boolean('is_active').default(true).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_department').on(table.departmentId),
    index('idx_users_role').on(table.roleId),
    index('idx_users_email').on(table.email),
  ],
);

// ── 2. Departments (Phòng ban) ────────────────────────────────────

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: text('name').notNull().unique(),
    description: text('description'),
    code: text('code').notNull().unique(), // Short code: 'TECH', 'SALES', etc.

    // Hierarchy (Phân cấp)
    parentId: uuid('parent_id'),

    // Metadata
    headUserId: uuid('head_user_id'), // Department head (Trưởng phòng)
    isActive: boolean('is_active').default(true).notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_departments_parent').on(table.parentId),
    index('idx_departments_code').on(table.code),
  ],
);

// ── 3. Roles (Vai trò) ───────────────────────────────────────────

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: text('name').notNull().unique(),
    displayName: text('display_name').notNull(),
    description: text('description'),

    // Permission set (Bộ quyền) — stored as JSON for flexibility
    permissions: jsonb('permissions').notNull().default({}),

    // Role level (Cấp bậc vai trò — for hierarchy comparison)
    level: integer('level').notNull().default(0),

    // System role (Vai trò hệ thống — cannot be deleted)
    isSystem: boolean('is_system').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Timestamps (Dấu thời gian)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_roles_name').on(table.name),
  ],
);

// ── 4. User Sessions (Phiên đăng nhập) ───────────────────────────

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id').notNull(),

    // Session metadata (Thông tin phiên)
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    deviceType: deviceTypeEnum('device_type'),

    // Timing (Thời gian)
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_sessions_user').on(table.userId),
    index('idx_user_sessions_started').on(table.startedAt),
  ],
);

// ── 5. User Invitations (Lời mời người dùng) ─────────────────────

export const userInvitations = pgTable(
  'user_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    email: text('email').notNull(),
    roleId: uuid('role_id').notNull(),
    departmentId: uuid('department_id'),

    invitedBy: uuid('invited_by').notNull(),

    // Token for email verification (Mã xác thực)
    token: text('token').notNull().unique(),
    status: invitationStatusEnum('status').default('pending').notNull(),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_user_invitations_email').on(table.email),
    index('idx_user_invitations_status').on(table.status),
    uniqueIndex('idx_user_invitations_token').on(table.token),
  ],
);
