# BizFlow — Project Memory
> Running log of context, decisions, and changes.
> Last Updated: November 12, 2026

---

## 🧠 Active Context

**Current Branch:** `feature/b2b-platform-v1`
**Last Commit:** `848487b` — B2B platform landing, marketplace, supplier register & SaaS fixes
**GitHub:** https://github.com/lovie1188/bizflow
**PR:** https://github.com/lovie1188/bizflow/pull/new/feature/b2b-platform-v1

**Local Dev Environment:**
- Backend: `D:\xampp\htdocs\bizflow\backend` → runs on `localhost:5000`
- Frontend: `D:\xampp\htdocs\bizflow\frontend` → runs on `localhost:3000`
- Database: Neon PostgreSQL (serverless, cold starts ~10-15s)

---

## 🏗️ Architecture Decisions (Permanent)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL structure | `/store/:storeName` for public storefronts | Clean, SEO-friendly, tenant-agnostic |
| Multi-tenancy | `company_id` scoping on every query | Simple, proven for this scale |
| Login branding | Always show "BizFlow" at `/login` | SaaS platform identity, not tenant identity |
| `/shop` access | Buyer-only (authenticated) | Keep buyer order management private |
| `/marketplace` | Public, no auth, all suppliers | Amazon/Blinkit style aggregated catalog |
| Supplier registration | Self-serve via `/supplier-register` | Low-friction onboarding |
| Slug generation | First word + first 3 chars of second word | "Charu Marketing" → "charumar" |
| Custom domain | Detected via hostname check in `App.jsx` | Zero-config for custom domains |
| Database | Neon PostgreSQL serverless | Existing, working, no migration needed |
| CSS framework | None — custom CSS variables | Avoids build complexity, full control |
| Icon library | lucide-react | Tree-shakeable, consistent style |
| Font | Manrope self-hosted | No CDN dependency, fast load |

---

## 📅 Change History

### November 12, 2026 — B2B Platform Launch
**Branch:** `feature/b2b-platform-v1` (new branch from `feature/b2b-platform-landing`)
**Commit:** `848487b`

**Files Changed:**
| File | What Changed |
|------|-------------|
| `backend/src/server.js` | Added `store_slug VARCHAR(100)` + `custom_domain VARCHAR(255)` migrations; auto-backfill UPDATE to generate slugs |
| `backend/src/routes/public.js` | `getCompanyByName` now does slug-first OR name lookup; added `GET /api/public/suppliers`; added `GET /api/public/marketplace/products` |
| `backend/src/routes/companies.js` | `PUT /settings` now accepts `store_slug` with regex validation + uniqueness check |
| `frontend/src/components/Logo.jsx` | Name priority: `nameProp → company?.name → 'BizFlow'`; removed hardcoded `'CHARU MKTG'` fallback |
| `frontend/src/components/layouts/ShopLayout.jsx` | Added `useParams()`, fetches public company name for `/store/:storeName`, passes as `name` prop to Logo |
| `frontend/src/pages/admin/AdminSettings.jsx` | Added "🏪 Your Public Store URL" glass-panel before Basic Information |
| `frontend/src/App.jsx` | Major routing overhaul — all new platform routes, root now shows PlatformLanding |

**Files Created:**
| File | Purpose |
|------|---------|
| `frontend/src/pages/platform/PlatformLanding.jsx` | B2B marketing landing page at `/` |
| `frontend/src/pages/platform/Marketplace.jsx` | Public aggregated marketplace at `/marketplace` |
| `frontend/src/pages/platform/SupplierRegister.jsx` | Supplier self-registration at `/supplier-register` |

### Previous Session — SaaS Improvements
**Branch:** `feature/saas-improvements`
**Commit:** `bf6d847`

- Products 500 error fix (removed `updated_at` from publicFields in products route)
- `window.confirm` → inline confirm UI on 6 admin pages (AdminBuyers, AdminProducts, AdminInvoices, AdminOrders, AdminStaff, AdminSettings)
- Multi-tenant JWT scoping for products API
- Neon DB resilience: 3-attempt retry with 5s delay, 10s query timeout

---

## 🗂️ Database State (Live — Neon)

### Known Companies
| ID | Name | store_slug | Plan |
|----|------|-----------|------|
| 1 | Charu Marketing | `charumar` | starter |

### Known Users (Dev)
| Email | Password | Role | Company |
|-------|----------|------|---------|
| `admin@bizflow.com` | `password123` | admin | Charu Marketing |
| `buyer1@acmecorp.com` | `password123` | buyer | — |
| `dev@bizflow.in` | `password123` | developer | — |

### Schema Notes
- `companies.store_slug` — added in `feature/b2b-platform-v1` migration, auto-backfilled
- `companies.custom_domain` — added same session; Charu Marketing has bad data: `"localhost/bizflow/charu "` (trailing space) — low priority cleanup
- `products.updated_at` — does NOT exist in schema (caused 500 error, now removed from queries)

---

## 🔑 Key Technical Details (Save These)

### Slug Algorithm (SQL)
```sql
LOWER(SPLIT_PART(name,' ',1) || SUBSTRING(SPLIT_PART(name,' ',2),1,3))
-- "Charu Marketing" → "charumar"
-- "ABC Enterprises" → "abcent"
```

### GSTIN Regex
```js
/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
// 15 chars, e.g. 29ABCDE1234F1Z5
```

### JWT Payload
```json
{ "userId": 1, "role": "admin", "companyId": 1 }
```

### ShopHome Public Mode Detection
```js
// ShopHome.jsx
const isPublic = Boolean(storeName) || isCustomDomain;
// Fetches from /api/public/store/:storeName when public
// Fetches from /api/products (authenticated) when in /shop
```

### Custom Domain Detection (App.jsx)
```js
const isCustomDomain = hostname !== 'localhost' && !hostname.includes('bizflow.in');
// true → root / shows ShopHome (tenant store)
// false → root / shows PlatformLanding
```

### Neon DB Retry Logic (db.js)
- 3 attempts on connection failure
- 5-second delay between retries
- 10-second query timeout
- Wait for "Migrations applied" in console before testing APIs

---

## 📌 Open Questions / Decisions Needed

| # | Question | Context |
|---|----------|---------|
| Q1 | Should `/store/:nonexistent` show a "Store Not Found" page? | Currently renders empty shell — API returns 404 but React SPA doesn't redirect |
| Q2 | Subscription plan pricing? | Starter/Growth/Enterprise — amounts TBD |
| Q3 | WhatsApp business approval status? | Twilio sandbox works; needs approved number for production |
| Q4 | Custom domain workflow? | UI for setting custom domain exists in settings; DNS pointing instructions needed |
| Q5 | Mobile app priority? | React Native scaffold in `mobile/` — when to start? |

---

## 🚫 Decisions Made (Do Not Revisit Unless Explicitly Asked)

- `/shop` stays buyer-only — not for public browsing
- Public catalog lives at `/marketplace` (not `/shop`)
- Supplier registration is self-serve (not invite-only)
- Login page always shows "BizFlow" branding — never tenant name
- No Tailwind CSS — custom design system only
- Manrope font stays self-hosted — no Google Fonts CDN
- `store_slug` auto-generated from company name — admin can edit it
