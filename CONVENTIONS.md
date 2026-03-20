# CONVENTIONS.md — Project Coding Conventions

> **SOT**: This file is the single source of truth for all naming, structure, and style conventions in SaaS Auto-Builder. All agents, generators, and contributors MUST follow these conventions.

---

## 1. Naming Conventions

### 1.1 Files & Directories

| Type | Convention | Example |
|------|-----------|---------|
| Directory | kebab-case | `user-journey/`, `code-guidelines/`, `llm-adapter/` |
| TypeScript source files | kebab-case `.ts` | `domain-classification.ts`, `stripe-webhook.ts` |
| React components | PascalCase `.tsx` | `BillingPortal.tsx`, `LoginForm.tsx` |
| React page files (Next.js App Router) | `page.tsx`, `layout.tsx`, `route.ts` | `app/(dashboard)/page.tsx` |
| Test files | `*.test.ts` or `*.test.tsx` | `fsm.test.ts`, `feature-registry.test.ts` |
| Template files | kebab-case with `.hbs` or `.ejs` suffix | `env.ts.hbs`, `schema.ts.hbs` |
| Config files | standard tool names | `tsconfig.json`, `biome.json`, `drizzle.config.ts` |
| Zod schemas | kebab-case, grouped in `schemas/` | `feature-spec.ts`, `intent-object.ts` |
| Markdown documents | UPPER-KEBAB or Title-Case | `ARCHITECTURE.md`, `TECHNICAL-DEBT.md` |

### 1.2 Functions & Variables

| Type | Convention | Example |
|------|-----------|---------|
| Functions | camelCase | `computeConfidence()`, `buildDomainClassificationPrompt()` |
| Variables | camelCase | `slotFillRatio`, `domainCertainty` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| Boolean variables | `is`/`has`/`should` prefix | `isAvailable`, `hasRLSPolicy`, `shouldRetry` |
| Event handlers | `handle` prefix | `handleWebhookEvent`, `handleApproval` |
| Builder/factory functions | `build`/`create` prefix | `buildPrompt()`, `createServerClient()` |
| Async functions | verb-noun, no `async` suffix | `fetchUser()`, `generatePRD()` |

### 1.3 TypeScript Types & Interfaces

| Type | Convention | Example |
|------|-----------|---------|
| Interfaces | PascalCase, noun | `IntentObject`, `SemanticFrame`, `FrameSlot` |
| Type aliases | PascalCase | `SaaSDomain`, `IllocutionaryType` |
| Zod schemas | PascalCase + `Schema` suffix | `FeatureSpecSchema`, `IntentObjectSchema` |
| Inferred types | PascalCase (same as schema minus `Schema`) | `type FeatureSpec = z.infer<typeof FeatureSpecSchema>` |
| Enums (prefer union types) | PascalCase for type, kebab-case for values | `type Priority = 'must-have' \| 'should-have' \| 'could-have' \| 'wont-have'` |
| Generic type params | Single uppercase letter or descriptive | `T`, `TInput`, `TOutput` |

### 1.4 Database Tables & Columns (Drizzle ORM)

| Type | Convention | Example |
|------|-----------|---------|
| Table names | snake_case, plural | `users`, `feature_specs`, `api_endpoints` |
| Column names | snake_case | `created_at`, `user_id`, `domain_classification` |
| Primary key | `id` (uuid) | `id: uuid('id').primaryKey().defaultRandom()` |
| Foreign keys | `{referenced_table_singular}_id` | `user_id`, `project_id`, `feature_id` |
| Timestamps | `created_at`, `updated_at` | Always include both on every table |
| Soft delete | `deleted_at` (nullable timestamp) | `deleted_at: timestamp('deleted_at')` |
| Boolean columns | `is_` prefix | `is_active`, `is_verified` |
| Status columns | `status` with enum type | `status: text('status').notNull().default('draft')` |
| JSON columns | `_data` suffix or descriptive | `metadata`, `slot_data`, `config_data` |

### 1.5 API Routes

| Type | Convention | Example |
|------|-----------|---------|
| REST endpoints | `/api/{resource}` | `/api/webhooks/stripe` |
| Next.js route handlers | `route.ts` in App Router directory | `app/api/webhooks/stripe/route.ts` |
| Server Actions | `actions.ts` in feature directory | `features/billing/actions.ts` |
| HTTP methods | standard REST verbs | GET (read), POST (create), PUT (full update), PATCH (partial), DELETE |

---

## 2. TypeScript Patterns

### 2.1 Imports

```typescript
// 1. External packages first (alphabetical)
import { z } from 'zod';
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

// 2. Internal absolute imports (from src/)
import { env } from '@/lib/env';
import { FeatureSpecSchema } from '@/shared/schemas/feature-spec';

// 3. Relative imports last
import { computeConfidence } from './confidence';
import type { IntentObject } from './types';
```

### 2.2 Exports

```typescript
// Named exports preferred (tree-shakeable)
export function generatePRD(intent: IntentObject): PRDDraft { ... }
export const FeatureSpecSchema = z.object({ ... });

// Default exports ONLY for Next.js pages/layouts (framework requirement)
export default function DashboardPage() { ... }

// Re-export from index.ts for public API of a module
// features/billing/index.ts
export { createCheckoutSession } from './actions';
export type { CheckoutParams } from './types';
```

### 2.3 Type Definitions

```typescript
// Prefer Zod schemas as SOT, infer TypeScript types from them
export const FeatureSpecSchema = z.object({
  id: z.string().regex(/^F-\d{3}$/),
  name: z.string().min(3).max(100),
  priority: z.enum(['must-have', 'should-have', 'could-have', 'wont-have']),
});
export type FeatureSpec = z.infer<typeof FeatureSpecSchema>;

// Use `interface` for object shapes that won't need Zod validation
interface LLMContext {
  model: string;
  temperature: number;
  maxTokens: number;
}

// Use `type` for unions, intersections, and computed types
type SaaSDomain = 'e-commerce' | 'marketplace' | 'crm' | 'project-management' | /* ... */ 'custom';
type RegistryData = FeatureSpec | ComponentSpec | APIEndpoint;
```

### 2.4 Error Handling

```typescript
// Use typed errors, not generic Error
class LLMTimeoutError extends Error {
  constructor(public readonly engine: string, public readonly timeoutMs: number) {
    super(`${engine} timed out after ${timeoutMs}ms`);
    this.name = 'LLMTimeoutError';
  }
}

// Zod validation at all boundaries
const parsed = FeatureSpecSchema.safeParse(data);
if (!parsed.success) {
  throw new ValidationError('Feature spec invalid', parsed.error);
}

// No try/catch without specific recovery logic
// BAD: try { ... } catch (e) { console.log(e); }
// GOOD: try { ... } catch (e) { if (e instanceof LLMTimeoutError) { return retry(); } throw e; }
```

### 2.5 Strict Mode Requirements

- `strict: true` in tsconfig.json — non-negotiable
- No `any` on security boundaries (auth middleware, API routes, webhook handlers)
- No `@ts-ignore` or `@ts-expect-error` without a linked issue comment
- No `eval()`, `Function()`, or `new Function()`
- No `as` type assertions on external data — use Zod `.parse()` instead

---

## 3. Project Structure

### 3.1 CLI Tool (Host) Structure

```
saas-auto-builder/
├── src/
│   ├── cli/                        # Thin adapter (Commander.js + Inquirer.js)
│   │   ├── commands/               # CLI command definitions
│   │   └── display/                # Terminal output formatting
│   ├── core/                       # Business logic (pure, no I/O)
│   │   ├── conversation/           # F1: 7-state FSM + smart questions
│   │   ├── pipeline/               # F2: 7-document orchestration
│   │   ├── propagation/            # F4: one-way context propagation
│   │   └── validation/             # F8: 8-rule cross-document validation
│   ├── generators/                 # Document generators (one per doc)
│   │   ├── prd/
│   │   ├── user-journey/
│   │   ├── trd/
│   │   ├── code-guidelines/
│   │   ├── ui-guidelines/
│   │   ├── information-architecture/
│   │   └── tasks/
│   ├── templates/                  # Code generation templates
│   │   ├── registry.ts             # Day-1 TemplateRegistry interface
│   │   └── nextjs-supabase/        # F3: ~50-70 file template set
│   ├── shared/                     # Shared types, schemas, config
│   │   ├── llm-adapter/            # Day-1 LLMAdapter interface
│   │   ├── schemas/                # Zod schemas (7 docs + 6 registries)
│   │   ├── config/
│   │   └── types/
│   ├── licensing/                  # F6: Free/Paid tier manager
│   └── host/                       # Integration domain
│       ├── llm/providers/          # ClaudeAdapter, GeminiCLIAdapter
│       └── infrastructure/         # CircuitBreaker, integration manifest
├── templates/                      # EJS/Handlebars code templates
├── test/
│   ├── fixtures/                   # Golden-file LLM responses (cassette pattern)
│   └── *.test.ts
└── package.json
```

### 3.2 Generated SaaS Structure

```
generated-saas/                     (~50-70 files)
├── app/                            # Next.js App Router
│   ├── (auth)/                     # Auth route group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/                # Protected route group
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── settings/page.tsx
│   │   └── billing/page.tsx
│   ├── (marketing)/                # Public route group
│   │   ├── page.tsx
│   │   └── pricing/page.tsx
│   ├── api/webhooks/stripe/route.ts
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── error.tsx
├── features/                       # Feature-based architecture
│   ├── auth/
│   │   ├── actions.ts
│   │   ├── middleware.ts
│   │   └── components/
│   ├── billing/
│   │   ├── actions.ts
│   │   ├── stripe-webhook.ts
│   │   ├── components/
│   │   └── README.md
│   └── [domain]/                   # User's business logic
│       ├── actions.ts
│       ├── components/
│       └── types.ts
├── lib/                            # Infrastructure
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema (SOT)
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── embeddings.ts
│   ├── stripe.ts
│   ├── env.ts                     # Zod-validated env vars
│   └── utils.ts
├── components/
│   ├── ui/                        # shadcn/ui
│   └── layout/
├── supabase/
│   └── migrations/
├── .env.example
├── middleware.ts                   # Auth + security headers (Edge Runtime)
├── next.config.ts
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── drizzle.config.ts
├── ARCHITECTURE.md
├── EVOLUTION.md
└── TECHNICAL-DEBT.md
```

### 3.3 Dependency Direction

```
cli → core → generators → shared
```

- **Nothing imports in the reverse direction.** ESLint boundary enforcement.
- `cli/` is a thin adapter — no business logic
- `core/` contains business logic — no I/O concerns
- `generators/` produce document/code output
- `shared/` contains types, schemas, utilities — imported by all other layers

---

## 4. Module Structure Pattern

Each feature module follows a consistent internal structure:

```
features/{feature-name}/
├── types.ts              # TypeScript types and Zod schemas for this feature
├── constants.ts          # Feature-specific constants and configuration
├── validation.ts         # Input validation schemas (Zod)
├── queries.ts            # Read operations (database queries, data fetching)
├── actions.ts            # Write operations (server actions, mutations)
├── components/           # React components scoped to this feature
│   ├── {Component}.tsx
│   └── index.ts          # Re-exports
├── hooks/                # React hooks scoped to this feature (optional)
│   └── use-{hook-name}.ts
└── index.ts              # Public API of the module (re-exports)
```

**Rules**:
- Each file has a single responsibility
- `types.ts` is the module-level SOT for type definitions
- `actions.ts` contains server actions (Next.js `'use server'`)
- `queries.ts` contains read-only database operations
- `components/` contains ONLY components specific to this feature
- Shared components go in `components/ui/` or `components/layout/`

---

## 5. Code Style

### 5.1 Formatting

- **Formatter**: Biome (primary, 56x faster than Prettier) + ESLint (import boundaries)
- **Indent**: 2 spaces (no tabs)
- **Line length**: 100 characters max
- **Semicolons**: required
- **Quotes**: single quotes for strings
- **Trailing commas**: ES5-compatible (in arrays, objects, function params)
- **Bracket spacing**: `{ key: value }` (spaces inside)

### 5.2 Comments

- **Language**: English for all code comments
- **When to comment**: Non-obvious "why", not "what" — code should be self-documenting
- **JSDoc**: On exported functions and interfaces only
- **TODO format**: `// TODO(#issue-number): description` — must link to an issue
- **No commented-out code**: Delete it; git history preserves everything

```typescript
// GOOD: explains "why"
// Stripe requires raw body for webhook signature verification
const body = await request.text();

// BAD: explains "what" (obvious from code)
// Get the user from the database
const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
```

### 5.3 UI Text

- **All user-facing text**: Externalizable (no hardcoded strings in components)
- **Generated SaaS UI**: English by default (user customizes post-generation)
- **CLI tool messages**: English
- **Error messages**: Actionable — tell the user what to do, not just what went wrong

---

## 6. Testing Conventions

### 6.1 Test File Location

- Tests live adjacent to source: `src/core/conversation/fsm.test.ts`
- Integration tests: `test/` directory at project root
- Fixtures: `test/fixtures/` for golden-file LLM cassettes

### 6.2 Test Naming

```typescript
describe('FSM', () => {
  describe('transition', () => {
    it('should move from initial_capture to domain_confirmation when domain is classified', () => {
      // ...
    });

    it('should reject transition when guard condition fails', () => {
      // ...
    });
  });
});
```

### 6.3 Test Structure

- **AAA pattern**: Arrange, Act, Assert
- **One assertion per test** (prefer)
- **No LLM calls in CI**: Use cassette pattern (recorded responses)
- **Test runner**: Vitest v2+
- **Coverage target**: 80%+ for core/, 60%+ overall

---

## 7. Environment & Configuration

### 7.1 Environment Variables

- All env vars validated via Zod in `lib/env.ts`
- No direct `process.env.X` access — always through `env.X`
- `.env.example` must list ALL required variables with placeholder values
- Secret naming: `{SERVICE}_SECRET_KEY`, `{SERVICE}_API_KEY`

### 7.2 Package Manager

- **pnpm** v9+ (mandatory — 3x npm performance, strict node_modules)
- Lock file committed: `pnpm-lock.yaml`
- No `npm` or `yarn` usage

### 7.3 Node.js

- Node.js 22 LTS
- ES modules (`"type": "module"` in package.json)

---

## 8. Git Conventions

### 8.1 Commit Messages

```
type(scope): description

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

### 8.2 Branch Naming

```
type/short-description
```

Examples: `feat/fsm-conversation`, `fix/stripe-webhook-idempotency`, `refactor/registry-types`

---

*This document is extracted from the PRD (v1.0, 2026-03-13) and serves as the authoritative conventions reference for all development work.*
