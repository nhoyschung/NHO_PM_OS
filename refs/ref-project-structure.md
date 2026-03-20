# Reference: Project Structure

> **SOT** for directory layout and file organization. Extracted from PRD §7.2, §16.1.

---

## 1. CLI Tool (Host) — Full Directory Structure

```
saas-auto-builder/
├── src/
│   ├── cli/                              # Thin adapter layer
│   │   ├── commands/                     # CLI command definitions (Commander.js)
│   │   │   ├── generate.ts               # Main generation command
│   │   │   ├── resume.ts                 # Resume incomplete generation
│   │   │   └── status.ts                 # Show pipeline status
│   │   └── display/                      # Terminal output formatting
│   │       ├── progress.ts               # Progress bars and spinners
│   │       ├── summary.ts                # Document summary display
│   │       └── colors.ts                 # ANSI color helpers
│   │
│   ├── core/                             # Business logic (pure, no I/O)
│   │   ├── conversation/                 # F1: Conversational SaaS Definition
│   │   │   ├── fsm.ts                    # 7-state Finite State Machine
│   │   │   ├── slots.ts                  # Semantic frame slot management
│   │   │   ├── confidence.ts             # Confidence routing logic
│   │   │   ├── questions.ts              # Smart question generation
│   │   │   ├── domains.ts                # 12 SaaS domain definitions
│   │   │   └── prompts/                  # LLM prompt templates for E1
│   │   │       └── domain-classification.ts
│   │   │
│   │   ├── pipeline/                     # F2: 7-document orchestration
│   │   │   ├── orchestrator.ts           # Sequential document generation
│   │   │   ├── approval-gate.ts          # Per-document approval mechanism
│   │   │   └── document-order.ts         # Generation DAG
│   │   │
│   │   ├── propagation/                  # F4: Context propagation
│   │   │   ├── registry-manager.ts       # 6-registry read/write
│   │   │   ├── forward-propagation.ts    # One-way cascading
│   │   │   └── staleness-tracker.ts      # Track stale documents
│   │   │
│   │   └── validation/                   # F8: Cross-document validation
│   │       ├── rules.ts                  # 8 validation rules
│   │       ├── validator.ts              # Rule execution engine
│   │       └── report.ts                 # Human-readable violation report
│   │
│   ├── generators/                       # Document generators (one per doc)
│   │   ├── prd/                          # E2: AI PM
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   ├── user-journey/                 # E5: User Research
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   ├── trd/                          # E6 (TRD-specific)
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   ├── code-guidelines/
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   ├── ui-guidelines/                # Design Agent (4-stage)
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   ├── information-architecture/     # UX Architect Agent
│   │   │   ├── generator.ts
│   │   │   └── prompts/
│   │   └── tasks/
│   │       ├── generator.ts
│   │       └── prompts/
│   │
│   ├── templates/                        # Code generation templates
│   │   ├── registry.ts                   # Day-1 TemplateRegistry interface
│   │   └── nextjs-supabase/              # F3: ~50-70 file template set
│   │       ├── config/                   # package.json.hbs, tsconfig.json.hbs, etc.
│   │       ├── auth/                     # Auth page templates
│   │       ├── billing/                  # Stripe webhook templates
│   │       ├── lib/                      # Utility templates (env.ts.hbs, etc.)
│   │       └── app/                      # App Router page templates
│   │
│   ├── shared/                           # Shared types, schemas, config
│   │   ├── llm-adapter/                  # Day-1 LLMAdapter interface
│   │   │   ├── types.ts                  # LLMProvider interface
│   │   │   └── index.ts
│   │   ├── schemas/                      # Zod schemas
│   │   │   ├── intent-object.ts          # IntentObject schema
│   │   │   ├── feature-spec.ts           # Feature Registry schema
│   │   │   ├── component-spec.ts         # Component Registry schema
│   │   │   ├── api-endpoint.ts           # API Registry schema
│   │   │   ├── data-model.ts             # DataModel Registry schema
│   │   │   ├── dependency.ts             # Dependency Registry schema
│   │   │   ├── constraint.ts             # Constraint Registry schema
│   │   │   ├── prd.ts                    # PRD document schema
│   │   │   ├── user-journey.ts           # User Journey schema
│   │   │   ├── trd.ts                    # TRD schema
│   │   │   ├── code-guidelines.ts
│   │   │   ├── ui-guidelines.ts
│   │   │   ├── information-architecture.ts
│   │   │   └── tasks.ts
│   │   ├── config/
│   │   │   └── defaults.ts               # Default configuration values
│   │   └── types/
│   │       ├── domain.ts                 # SaaSDomain, ComplianceDomain
│   │       ├── fsm.ts                    # FSM state types
│   │       └── index.ts
│   │
│   ├── licensing/                        # F6: Free/Paid tier
│   │   ├── license-manager.ts
│   │   └── types.ts
│   │
│   └── host/                             # Integration domain
│       ├── llm/
│       │   └── providers/
│       │       ├── claude-adapter.ts      # V1: Claude implementation
│       │       └── gemini-adapter.ts      # V1.1: Gemini CLI implementation
│       └── infrastructure/
│           ├── circuit-breaker.ts
│           └── integration-manifest.json
│
├── templates/                            # EJS/Handlebars code templates
│   └── nextjs-supabase/                  # Template files (.hbs, .ejs)
│
├── test/
│   ├── fixtures/                         # Golden-file LLM responses (cassette)
│   │   ├── e-commerce/                   # Per-domain test fixtures
│   │   ├── marketplace/
│   │   └── crm/
│   ├── fsm.test.ts
│   ├── pipeline.test.ts
│   ├── registries.test.ts
│   └── validation.test.ts
│
├── package.json
├── tsconfig.json
├── biome.json
├── vitest.config.ts
└── README.md
```

---

## 2. Generated SaaS — Full Directory Structure (~50-70 files)

```
generated-saas/
├── app/                                  # Next.js 15 App Router
│   ├── (auth)/                           # Auth route group (unprotected)
│   │   ├── login/
│   │   │   └── page.tsx                  # Login page
│   │   ├── signup/
│   │   │   └── page.tsx                  # Signup page
│   │   └── callback/
│   │       └── route.ts                  # OAuth callback handler
│   │
│   ├── (dashboard)/                      # Protected route group
│   │   ├── layout.tsx                    # Dashboard shell (sidebar, header)
│   │   ├── page.tsx                      # Dashboard home
│   │   ├── settings/
│   │   │   └── page.tsx                  # User settings
│   │   └── billing/
│   │       └── page.tsx                  # Billing management
│   │
│   ├── (marketing)/                      # Public route group
│   │   ├── page.tsx                      # Landing page
│   │   └── pricing/
│   │       └── page.tsx                  # Pricing page
│   │
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts              # Stripe webhook handler
│   │
│   ├── layout.tsx                        # Root layout (HTML, fonts, providers)
│   ├── not-found.tsx                     # 404 page
│   └── error.tsx                         # Error boundary
│
├── features/                             # Feature-based architecture
│   ├── auth/
│   │   ├── actions.ts                    # Auth server actions
│   │   ├── middleware.ts                 # Auth middleware helpers
│   │   └── components/
│   │       ├── LoginForm.tsx
│   │       ├── SignupForm.tsx
│   │       └── AuthGuard.tsx
│   │
│   ├── billing/
│   │   ├── actions.ts                    # Billing server actions
│   │   ├── stripe-webhook.ts             # 6-event full lifecycle handler
│   │   ├── components/
│   │   │   ├── PricingCard.tsx
│   │   │   ├── BillingPortal.tsx
│   │   │   └── SubscriptionStatus.tsx
│   │   └── README.md                     # Billing feature documentation
│   │
│   └── [domain]/                         # User's business logic (LLM-generated)
│       ├── actions.ts                    # Domain-specific server actions
│       ├── types.ts                      # Domain types + Zod schemas
│       └── components/
│           └── *.tsx                      # 3-8 domain components
│
├── lib/                                  # Infrastructure layer
│   ├── supabase/
│   │   ├── server.ts                     # createServerClient (cookies-based)
│   │   ├── client.ts                     # createBrowserClient
│   │   └── middleware.ts                 # Supabase middleware helpers
│   ├── db/
│   │   ├── schema.ts                     # Drizzle ORM schema (SOT)
│   │   ├── index.ts                      # Database connection
│   │   └── seed.ts                       # Seed data script
│   ├── embeddings.ts                     # pgvector + Voyage-3
│   ├── stripe.ts                         # Stripe client initialization
│   ├── env.ts                            # Zod-validated environment variables
│   └── utils.ts                          # Shared utility functions
│
├── components/                           # Shared UI components
│   ├── ui/                               # shadcn/ui components (npx shadcn add)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── toast.tsx
│   └── layout/                           # Layout components (LLM-generated)
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── supabase/
│   └── migrations/                       # SQL migration files
│       └── 0001_initial.sql
│
├── .env.example                          # Environment variable template
├── drizzle.config.ts                     # Drizzle ORM configuration
├── middleware.ts                          # Edge Runtime: auth + security headers
├── next.config.ts                        # Next.js configuration
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config (strict: true)
├── biome.json                            # Linter/formatter config
├── vitest.config.ts                      # Test configuration
├── vercel.json                           # Vercel deployment config
├── ARCHITECTURE.md                       # Generated architecture docs
├── EVOLUTION.md                          # Evolution triggers + checklist
└── TECHNICAL-DEBT.md                     # Pre-populated debt inventory
```

---

## 3. File Count Breakdown

| Category | File Count | Source |
|----------|-----------|--------|
| Config files | ~10 | Handlebars templates (0% structural debt) |
| Auth infrastructure | ~7 | Handlebars templates (0% structural debt) |
| Billing infrastructure | ~5 | Handlebars templates (0% structural debt) |
| App shell | ~6 | Handlebars + LLM (semantic review) |
| Database schema | ~4 | LLM-generated (semantic review) |
| Domain features | 5-25 | LLM-generated (semantic review) |
| Shared utilities | ~5 | Handlebars templates (0% structural debt) |
| UI components | ~10 | shadcn/ui CLI (0% structural debt) |
| Documentation | ~3 | LLM-generated (semantic review) |
| **Total** | **~50-70** | Base ~45 + domain-specific 5-25 |

---

## 4. Architecture Principles

### 4.1 Feature-Based Architecture
- Everything for a feature lives in one directory: `features/{name}/`
- Cross-feature dependencies go through `lib/`
- No horizontal layers spanning features

### 4.2 Route Group Organization (Next.js App Router)
- `(auth)/` — Unauthenticated routes (login, signup)
- `(dashboard)/` — Protected routes (requires auth)
- `(marketing)/` — Public routes (landing, pricing)
- `api/` — API route handlers

### 4.3 Dependency Direction
```
app/ → features/ → lib/ → shared types
```
- Pages import from features
- Features import from lib
- Lib contains infrastructure (no business logic)

### 4.4 Two-Domain Architecture
The system has two distinct file structures:
1. **CLI Tool (Host)** — the generator itself (~85 files by V2)
2. **Generated SaaS** — the output (~50-70 files)

Different quality bars:
- Generated SaaS: 0% structural debt (templates are deterministic)
- CLI Tool: 30% acceptable tooling debt

---

## 5. Runtime State Files

Generated during CLI execution, gitignored:

```
.saas-builder/
├── intent.json                    # IntentObject (Zod-validated)
├── conversation-state.json        # FSM state
├── registries/
│   ├── feature-registry.json      # FeatureSpec[]
│   ├── component-registry.json    # ComponentSpec[]
│   ├── api-registry.json          # APIEndpoint[]
│   ├── data-model-registry.json   # DataModel[]
│   ├── dependency-registry.json   # Dependency[]
│   └── constraint-registry.json   # Constraint[]
├── generated/                     # Staging area before 7-gate validation
└── metrics.json                   # Local-only timing/counts
```

---

*Source: PRD v1.0 §7.2, §7.3, §16.1, §9.5*
