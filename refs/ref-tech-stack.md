# Reference: Technology Stack

> **SOT** for all technology decisions. Extracted from PRD §8.

---

## 1. CLI Tool Stack (Host)

| Layer | Technology | Version | Consensus | Rationale |
|-------|-----------|---------|-----------|-----------|
| Runtime | Node.js | 22 LTS | 4/4 | 15yr+, 98% Fortune 500, enterprise proven |
| Language | TypeScript | 5.x strict | 4/4 | Compile-time safety; `strict: true` minimum |
| CLI Framework | Commander.js | v12+ | 4/4 | 13yr+, 160M/wk downloads, stability over novelty |
| Interactive Prompts | Inquirer.js | v8 LTS | 4/4 | 12yr+, 28M/wk downloads |
| LLM SDK | @anthropic-ai/sdk | latest | 4/4 | Official SDK, Claude Code native |
| LLM Feature | Structured Outputs | GA | 3.5/4 | 100% schema compliance via constrained decoding |
| LLM Feature | Prompt Caching | GA | 3.5/4 | 76-90% cost reduction (automatic) |
| Schema Validation | Zod | v3.x | 3.5/4 | Type + validation + LLM schema in single source of truth |
| Code Templates | Handlebars + EJS | stable | 4/4 | 14yr+ proven, code scaffolding standard |
| Build (prod) | tsup | latest | 4/4 | esbuild-based, zero config |
| Dev Runner | tsx | latest | 4/4 | TypeScript execution without compile step |
| Package Manager | pnpm | v9+ | 4/4 | 3x npm performance, strict node_modules |
| Linting | Biome + ESLint | latest | 3/4 | 56x faster + import boundary enforcement |
| Testing | Vitest | v2+ | 4/4 | 10x Jest speed, TypeScript native |
| CI/CD | GitHub Actions + semantic-release | N/A | 4/4 | OSS free, automated versioning |
| State Management | File-based JSON/YAML | N/A | 4/4 | No DB needed for CLI tool |

---

## 2. Generated SaaS Stack

| Layer | Technology | Version/Notes | Decisive Reason |
|-------|-----------|---------------|----------------|
| Framework | Next.js 15 | App Router | 32% fewer files (58 vs 85 for Pages Router), Server Components |
| Language | TypeScript | 5.x strict | Generated code minimum quality standard |
| ORM | Drizzle ORM | latest | TypeScript-native schema; generator constructs programmatically |
| Database | Supabase PostgreSQL | + pgvector | Auth + DB + RLS + vector search in one service |
| Auth | Supabase Auth | SSR | `auth.uid()` RLS native; removes 60+ line bridge |
| Payments | Stripe | manual webhooks | Transparency: users can read and debug payment code |
| UI Framework | shadcn/ui | latest | 65K+ stars, code ownership model |
| CSS | Tailwind CSS | v4 | Utility-first, co-located styling |
| Client State | Zustand | latest | Lightweight, no boilerplate |
| Server State | TanStack Query | latest | Server state != client state (Linsley) |
| Forms | react-hook-form + Zod | latest | Validation unified across client and server |
| Deployment | Vercel | zero-config | Next.js origin company |
| Semantic Search | pgvector (HNSW) | latest | Factory multiplier: retrofit cost >> generation cost |
| Embeddings | Voyage-3 (Anthropic) | latest | Accuracy-optimized for technical content |
| Error Tracking | Sentry | latest | 10yr+ production validation |
| Analytics | PostHog | latest | Free tier 1M events/mo; EU residency available |
| Email (V1.1) | Resend + React Email | latest | Developer experience; Postmark migration path |

---

## 3. Key Rejected Technologies

| Technology | Why Rejected |
|------------|-------------|
| Claude Agent SDK | Pre-1.0, production-unproven at scale, 3/4 perspectives rejected |
| Ink (React TUI) | Adds complexity without proportional value for V1 CLI |
| Temporal/Airflow | Built for deterministic task graphs; this system has semantic dependencies |
| Ajv (as primary) | Zod selected as single source; Ajv kept as fallback only |
| Prisma | Custom DSL (`schema.prisma`) — Drizzle uses TypeScript directly, natural for code generation |
| Stripe Sync Engine | Abstracts away 300+ lines; users cannot debug payment code; transparency > automation |

---

## 4. Why Drizzle over Prisma

Drizzle's schema is TypeScript code. Prisma's schema is a custom DSL (`schema.prisma`). A TypeScript code generator naturally produces TypeScript. Generating a custom DSL requires an additional translation layer with its own failure modes.

## 5. Why Manual Stripe Webhooks over Sync Engine

The Sync Engine abstracts away 300+ lines of webhook code. This sounds beneficial until a user's payment fails and they cannot debug their own payment system. For generated code, **transparency > automation**. Users must own and understand their billing logic.

## 6. Why pgvector as Default

Factory multiplier argument:
- Cost of generating pgvector infrastructure at generation time: ~200 lines of code
- Cost of retrofitting semantic search into a production SaaS: a full sprint (migration, backfill, frontend, testing)
- The generator eliminates this rework for every user

Default scaffold is optional — lazy-initialized, no startup failure if `VOYAGE_API_KEY` is missing.

---

## 7. Day-1 Adapter Interfaces (7 total)

Each interface is defined before implementation. Each adapter is a single file. Swapping providers requires changing exactly one file.

| Interface | Purpose | V1 Implementation |
|-----------|---------|-------------------|
| `LLMProvider` | Multi-LLM support | `ClaudeAdapter` |
| `PaymentProvider` | Billing abstraction | Stripe |
| `AuthProvider` | Auth abstraction | Supabase Auth |
| `EmailProvider` | Email sending | Resend (V1.1) |
| `StorageProvider` | File storage | Supabase Storage |
| `AnalyticsProvider` | Product analytics | PostHog |
| `DeployProvider` | Deployment config | Vercel |

### Interface Signatures

```typescript
interface LLMProvider {
  complete(prompt: VersionedPrompt, context: LLMContext): Promise<LLMResponse>;
  isAvailable(): Promise<AvailabilityCheck>;
  estimatedLatencyMs(): number;
}

interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;
  handleWebhookEvent(payload: string, signature: string): Promise<WebhookResult>;
  createBillingPortalSession(customerId: string): Promise<BillingPortalSession>;
}

interface AuthProvider {
  getServerUser(request: Request): Promise<AuthUser | null>;
  generateRLSPolicies(schema: DatabaseSchema): Promise<RLSPolicy[]>;
}

interface EmailProvider {
  send(template: EmailTemplate, recipient: Recipient): Promise<SendResult>;
  sendBatch(template: EmailTemplate, recipients: Recipient[]): Promise<BatchResult>;
}

interface StorageProvider {
  upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageKey>;
  generatePresignedUrl(key: string, expiresIn: number): Promise<string>;
}

interface AnalyticsProvider {
  trackEvent(event: TrackedEvent, userId: string): void;
  identifyUser(userId: string, traits: UserTraits): void;
}

interface DeployProvider {
  generateConfig(project: ProjectSpec): Promise<DeployConfig>;
  generateCIWorkflow(project: ProjectSpec): Promise<CIWorkflow>;
}
```

---

## 8. Strangler Fig Migration Paths

| Current | Replacement | Trigger | Interface |
|---------|-------------|---------|-----------|
| Gemini CLI | Gemini MCP server | MCP readiness 4/5 | LLMProvider |
| Resend | Postmark | Deliverability >10K emails/mo | EmailProvider |
| Stripe | LemonSqueezy | European tax compliance | PaymentProvider |
| Supabase Auth | Clerk | Maximum OAuth flexibility | AuthProvider |
| Vercel | Railway | Persistent WebSocket needs | DeployProvider |
| PostHog | Mixpanel/Amplitude | Pricing requirements | AnalyticsProvider |

---

## 9. Multi-LLM Strategy

### V1 — Claude-Only (Weeks 1-10)
- Claude Code as native host, zero integration work
- Full 9-engine pipeline through Claude
- `LLMProvider` interface defined in Week 1, only `ClaudeAdapter` implemented

### V1.1 — Gemini CLI (Weeks 10-14)
- Behind feature flag, cannot block V1 delivery
- 2M-token context for full-codebase security review
- Circuit Breaker: CLOSED → OPEN after 3 failures, 30-min recovery

### V2+ — ChatGPT (Conditional)
- Stability rating: 3/10 as of March 2026
- Deferred until stable official CLI
- Interface slot exists from Day 1

---

## 10. Integration Stack

### Anti-Corruption Layer (5-Layer)
```
Raw CLI output → parse → Zod schema validate → normalize → domain type → use in pipeline
```

### Circuit Breaker (Nygard 2007)
- CLOSED → OPEN after 3 consecutive failures
- 30-minute recovery period
- HALF-OPEN: single probe; success → CLOSED, failure → OPEN extended
- State persisted to disk
- Fallback: Claude-only generation (always available)

### Non-Negotiable Integration Rules
- 90-second process kill timeout
- `null` vs empty string distinction
- Zod schema validation on ALL external CLI output

---

*Source: PRD v1.0 §8.1, §8.2, §8.3, §10.1-10.4*
