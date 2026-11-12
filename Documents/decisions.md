# BizFlow — Architectural Decision Records (ADR)
> Why things are built the way they are.
> These decisions are LOCKED unless explicitly re-opened.
> Last Updated: November 2026

---

## How to Read This File

Each ADR has:
- **Status**: Accepted / Superseded / Deprecated
- **Decision**: What was chosen
- **Why**: The reasoning
- **Rejected alternatives**: What was considered and why it lost

---

## ADR-001: Database — Neon PostgreSQL over local/Docker

**Status:** Accepted

**Decision:** Use Neon serverless PostgreSQL as the database for both development and production.

**Why:**
- Zero local setup — no Docker, no pg service, works on any machine
- Neon free tier is sufficient for current scale
- Same DB in dev and prod = no "works on my machine" DB bugs
- Serverless = no idle costs in production

**Trade-off accepted:** Cold starts (~10-15s) on first request in development. Acceptable because we have retry logic in `db.js`.

**Rejected:**
- Local PostgreSQL — requires installation and setup on every dev machine
- Docker Compose PostgreSQL — requires Docker Desktop; heavier setup
- MySQL — team is PostgreSQL-familiar; Neon doesn't offer MySQL

---

## ADR-002: No ORM — Raw SQL with `pg`

**Status:** Accepted

**Decision:** Use the `pg` Node.js driver directly with parameterised queries. No Prisma, Sequelize, or Knex.

**Why:**
- Full control over queries — important for Indian GST-specific aggregations
- No ORM magic hiding N+1 issues
- Easier to audit SQL for security
- GST breakup calculations (line-item level) are complex; ORM would fight us

**Rejected:**
- Prisma — excellent DX but generates verbose SQL; migration system is opinionated
- Sequelize — verbose, mixed community opinion, weak TypeScript support
- Knex — query builder only, still need to write most logic manually

---

## ADR-003: JWT Auth over Sessions

**Status:** Accepted

**Decision:** Use JWT tokens stored in `localStorage` on the frontend, verified on every request.

**Why:**
- Stateless — backend doesn't need a session store (no Redis dependency)
- Works naturally with the multi-tenant model (`companyId` in payload)
- Mobile-ready if we build React Native later

**Trade-off accepted:**
- JWTs can't be truly invalidated before expiry → mitigated with `tokenBlacklist` (in-memory)
- `localStorage` is XSS-readable → mitigated with strict CSP and no third-party scripts

**Rejected:**
- HTTP-only cookies + sessions → requires Redis or DB session store; more complex CORS setup
- Short-lived tokens + refresh → adds complexity; not needed at current scale

---

## ADR-004: Custom CSS Variables over Tailwind/Bootstrap

**Status:** Accepted

**Decision:** All styling uses CSS custom properties defined in `frontend/src/index.css`. No CSS framework.

**Why:**
- Full design control — the "premium & tight" aesthetic is hard to achieve with Tailwind utility classes
- Smaller bundle — no Tailwind runtime or CSS purge step
- Design tokens (variables) are reusable and easy to theme
- Existing codebase was already built this way — no migration cost

**Rejected:**
- Tailwind CSS — utility-first conflicts with the semantic class naming already established; purge configuration needed
- Bootstrap — too generic; difficult to achieve premium look without overriding everything
- CSS Modules — adds file overhead; CSS variables achieve the same consistency

---

## ADR-005: CRA (Create React App) over Vite

**Status:** Accepted (Legacy — migration possible in future)

**Decision:** Keep Create React App (`react-scripts 5.0.1`) as the build tool.

**Why:**
- Existing project — migration to Vite would require testing every component and feature
- CRA 5 is stable and sufficient for current scale
- Hot reload works fine in development

**Trade-off accepted:**
- Slower cold build vs Vite
- CRA is in maintenance mode — Vite migration is a future option
- ESLint rule names in disable comments don't work in this CRA version → use bare `// eslint-disable-next-line`

---

## ADR-006: Multi-Tenancy via `company_id` Column Scoping

**Status:** Accepted

**Decision:** All tenant data is stored in shared tables, scoped by `company_id` column. No separate schemas or databases per tenant.

**Why:**
- Simpler infrastructure — one DB, one schema
- Sufficient for current scale (< 100 tenants expected initially)
- PostgreSQL row-level security possible if needed later
- Easier migrations (one migration applies to all tenants)

**Trade-off accepted:**
- One bad query without `company_id` filter = data leak
- Mitigated by: auth middleware that sets `req.companyId`; code review rule to always check `company_id` scope

**Rejected:**
- Schema-per-tenant — complex migrations, hard to query cross-tenant
- DB-per-tenant — overkill at this scale; expensive

---

## ADR-007: `/shop` Buyer-Only, `/marketplace` Public

**Status:** Accepted

**Decision:**
- `/shop/*` — authenticated buyer area (orders, cart, invoices)
- `/marketplace` — public aggregated catalog (no login needed)
- `/store/:slug` — public individual supplier store (no login needed)

**Why:**
- Clear mental model: public browsing vs. authenticated transacting
- Buyers don't want to log in just to browse — reduces friction
- Separating public and private keeps `/shop` secure and fast (authenticated context already loaded)
- Amazon/Blinkit model: browse publicly, transact with account

**Rejected:**
- `/shop` as public marketplace — would break existing buyer auth flow; confusing for buyers who expect their orders there
- Single `/shop` with both modes — too much complexity in one route; auth context mixing

---

## ADR-008: Store Slug Auto-Generation Formula

**Status:** Accepted

**Decision:** `store_slug = LOWER(word1 + first3chars(word2))`
- "Charu Marketing" → `charumar`
- "ABC Enterprises" → `abcent`
- "Raj Foods" → `rajfoo`

Admin can edit the slug after generation.

**Why:**
- Short, memorable URLs
- Avoids full company name in URL (may reveal confidential info)
- Easy to remember
- Admin editable = flexibility for custom branding

**Rejected:**
- Full company name slugified (e.g., `charu-marketing`) — too long for URLs
- UUID-based — not memorable, defeats the purpose
- First 8 chars — could collide easily ("ABC Enterprises" vs "ABC Exports" both become `abcenter...`)

---

## ADR-009: Self-Hosted Manrope Font

**Status:** Accepted

**Decision:** Manrope font served from `/public/fonts/` (5 WOFF2 files), not from Google Fonts CDN.

**Why:**
- No CDN dependency — works offline, works in restricted networks
- No privacy/GDPR concern from Google Fonts CDN
- Faster — no extra DNS lookup + connection
- Font files are small (< 100KB total for all 5 weights)

---

## ADR-010: BizFlow Branding at `/login`, Tenant Name at `/store/:slug`

**Status:** Accepted (November 2026)

**Decision:**
- `/login`, `/marketplace`, `/` → show "BizFlow" platform branding
- `/store/:storeName/*` → show tenant company name in nav/logo
- `/admin` → show company name from auth context (supplier knows their own company)

**Why:**
- SaaS platform identity must be clear at login — user is logging into BizFlow, not a tenant
- When browsing a supplier's store, the buyer should see the supplier's brand — that's the whole point of the storefront
- Avoids confusion: "Am I on BizFlow or Charu Marketing?"

**Implementation:** `Logo.jsx` priority chain: `nameProp → company?.name → 'BizFlow'`. `ShopLayout.jsx` fetches tenant name via public API when on `/store/:storeName`.

---

## ADR-011: Google Drive for File Storage (not AWS S3)

**Status:** Accepted

**Decision:** Product images and buyer agreement PDFs are stored in Google Drive via Service Account.

**Why:**
- Existing integration already built and working
- No S3 costs or AWS account required
- Google Drive provides easy sharing/auditing of documents
- Sufficient for current scale

**Trade-off accepted:**
- Drive API has rate limits (1000 req/100s) — fine for current load
- Drive is not a CDN — image URLs are Drive URLs, not fast CDN URLs

**Rejected:**
- AWS S3 — requires AWS account, IAM setup, S3 bucket, CloudFront for CDN
- Cloudinary — additional paid service; not needed yet

**Future:** When product images become a performance concern, migrate to Cloudinary or S3 + CloudFront.
