# Reference: Foundation Schema

> **SOT** for foundation database tables. Extracted from PRD §6, §8, §10.

---

## Overview

Foundation tables are the base layer of the generated SaaS schema. They handle identity, organization, and access control. These tables are **template-generated** (0% structural debt) because authentication and authorization patterns are invariant across SaaS domains.

All schemas use **Drizzle ORM** with TypeScript-native definitions.

---

## 1. Users Table

The `users` table extends Supabase Auth's built-in `auth.users` with application-specific fields.

```typescript
import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // Primary key — matches Supabase Auth uid
  id: uuid('id').primaryKey().notNull(),

  // Profile
  email: text('email').notNull().unique(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),

  // Organization
  department_id: uuid('department_id').references(() => departments.id),
  role_id: uuid('role_id').references(() => roles.id).notNull(),

  // Billing
  stripe_customer_id: text('stripe_customer_id').unique(),
  subscription_status: text('subscription_status', {
    enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete']
  }).default('incomplete'),
  subscription_tier: text('subscription_tier', {
    enum: ['free', 'pro', 'team', 'enterprise']
  }).default('free'),

  // Preferences
  preferences: jsonb('preferences').default({}),
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en'),

  // Status
  is_active: boolean('is_active').default(true).notNull(),
  is_verified: boolean('is_verified').default(false).notNull(),
  last_login_at: timestamp('last_login_at', { withTimezone: true }),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});
```

### Users — RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "users_admin_read_all"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "users_admin_update_all"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

## 2. Departments Table

```typescript
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(),
  description: text('description'),
  code: text('code').notNull().unique(), // Short code: 'TECH', 'SALES', etc.

  // Hierarchy
  parent_id: uuid('parent_id').references(() => departments.id),

  // Metadata
  head_user_id: uuid('head_user_id'), // Department head (FK set after users table)
  is_active: boolean('is_active').default(true).notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Departments — RLS Policies

```sql
-- All authenticated users can read departments
CREATE POLICY "departments_read_authenticated"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify departments
CREATE POLICY "departments_admin_modify"
  ON departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

## 3. Roles Table

```typescript
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(),
  display_name: text('display_name').notNull(),
  description: text('description'),

  // Permission set — stored as JSON for flexibility
  permissions: jsonb('permissions').notNull().default({}),

  // Role level (for hierarchy comparison)
  level: integer('level').notNull().default(0),

  // System role (cannot be deleted)
  is_system: boolean('is_system').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),

  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Default Roles

| Role Name | Display Name | Level | System? | Description |
|-----------|-------------|-------|---------|-------------|
| `admin` | Administrator | 100 | Yes | Full system access |
| `manager` | Manager | 80 | Yes | Department-level management |
| `lead` | Team Lead | 60 | Yes | Team-level supervision |
| `member` | Member | 40 | Yes | Standard user access |
| `viewer` | Viewer | 20 | Yes | Read-only access |

### Roles — RLS Policies

```sql
-- All authenticated users can read roles
CREATE POLICY "roles_read_authenticated"
  ON roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify roles
CREATE POLICY "roles_admin_modify"
  ON roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

## 4. User Sessions Table (Audit Extension)

```typescript
export const user_sessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),

  user_id: uuid('user_id').references(() => users.id).notNull(),

  // Session metadata
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  device_type: text('device_type', { enum: ['desktop', 'mobile', 'tablet', 'unknown'] }),

  // Timing
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  ended_at: timestamp('ended_at', { withTimezone: true }),
  last_active_at: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 5. User Invitations Table

```typescript
export const user_invitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),

  email: text('email').notNull(),
  role_id: uuid('role_id').references(() => roles.id).notNull(),
  department_id: uuid('department_id').references(() => departments.id),

  invited_by: uuid('invited_by').references(() => users.id).notNull(),

  // Token for email verification
  token: text('token').notNull().unique(),
  status: text('status', {
    enum: ['pending', 'accepted', 'expired', 'revoked']
  }).default('pending').notNull(),

  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  accepted_at: timestamp('accepted_at', { withTimezone: true }),

  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 6. Relations

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.department_id],
    references: [departments.id],
  }),
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
  sessions: many(user_sessions),
  invitations_sent: many(user_invitations),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  parent: one(departments, {
    fields: [departments.parent_id],
    references: [departments.id],
  }),
  children: many(departments),
  members: many(users),
  head: one(users, {
    fields: [departments.head_user_id],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));
```

---

## 7. Auth Security Requirements

### Non-Negotiable Patterns

| Pattern | Requirement |
|---------|-------------|
| Server-side auth | `supabase.auth.getUser()` — NOT `getSession()` (forgeable) |
| Client creation | `createServerClient` in Server Components and API routes |
| Edge middleware | Auth checks at the edge (50ms globally) |
| RLS default | Every user-scoped table gets RLS policies — not optional |
| Token storage | Server-side only via Supabase SSR (cookies), NEVER localStorage |
| Rate limiting | Rate limiting middleware on login/signup endpoints |

### Auth Flow

```
1. User visits /login → LoginForm component
2. Form submits to Supabase Auth
3. Supabase redirects to /callback
4. /callback/route.ts exchanges code for session
5. middleware.ts validates session on every request
6. Server Components use getUser() for auth checks
7. RLS policies enforce data access at database level
```

---

## 8. Zod Validation Schemas

```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1).max(255).nullable(),
  role_id: z.string().uuid(),
  department_id: z.string().uuid().nullable(),
  subscription_status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete']),
  subscription_tier: z.enum(['free', 'pro', 'team', 'enterprise']),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});

export const CreateUserSchema = UserSchema.pick({
  email: true,
  full_name: true,
  role_id: true,
  department_id: true,
});

export const UpdateUserSchema = UserSchema.partial().omit({ id: true });

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
```

---

## 9. Environment Variables (Foundation)

```typescript
// lib/env.ts — Foundation-related env vars
const envSchema = z.object({
  // Supabase (always required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // App config
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
```

---

*Source: PRD v1.0 §6 (F3), §8.2, §10.3, §11.5*
