# BizFlow — Development Rules & Conventions
> These rules apply to all developers and AI coding agents on this project.
> Last Updated: November 2026

---

## 0. Rule Priority (When Conflicts Arise)

1. Safety, security, data-integrity constraints
2. Explicit instruction in the current task
3. These project rules
4. Existing project architecture and conventions
5. Developer preferences / assumptions

---

## 1. The Golden Rules

### Commit & Push
> **NEVER commit or push without explicit user/developer confirmation.**
> Always show test URLs and get a go-ahead first.

### No Silent Scope Creep
> Do NOT refactor, restyle, or clean up code that is outside the requested scope.
> If you notice a problem outside scope → flag it, don't fix it silently.

### No Assumptions
> When uncertain: inspect first (read the code), then ask.
> Never manufacture missing requirements, credentials, or behavior.

### Double Audit Rule (from `.agents/AGENTS.md`)
> Every change must be reviewed twice before confirming complete:
> 1. First audit: "Is everything in the right place?"
> 2. Second audit: "Are there edge cases or errors I missed?"

---

## 2. Database Rules

### ⚠️ MANDATORY: Never change schema without approval
Before creating any new table, column, index, or migration:
1. Present the requirement to the user/developer
2. Explain what will change and why
3. Wait for **explicit written approval**
4. Then implement

### Safe vs Dangerous Operations
| Operation | Risk | Rule |
|-----------|------|------|
| `SELECT` queries | None | Fine |
| `CREATE TABLE IF NOT EXISTS` | Low | Need approval |
| `ALTER TABLE ADD COLUMN` (nullable) | Medium | Need approval |
| `ALTER TABLE ADD COLUMN NOT NULL` | High | Inspect data + approval |
| `UPDATE` large table | High | Verify row count first |
| `DROP TABLE / DROP COLUMN` | 🔴 Destructive | Immediate explicit confirmation + backup |
| `TRUNCATE` / broad `DELETE` | 🔴 Destructive | Immediate explicit confirmation |

### Query Style
- Always use parameterised queries: `pool.query('SELECT * FROM x WHERE id = $1', [id])`
- Always scope by `company_id` on every query in protected routes
- Never concatenate user input into SQL

---

## 3. Security Rules

### Secrets
- Never put API keys, JWT secrets, or DB credentials in frontend code
- Never commit `.env` file (it's gitignored)
- Never hardcode credentials in source files
- Backend service account JSON (`google-service-account.json`) is gitignored

### Auth
- Every protected API endpoint must verify JWT and check `company_id` scope
- Frontend auth guards (ProtectedRoute) are UX convenience only — backend is the real guard
- Never bypass auth for development convenience

### Sensitive Data in Logs
- Never log passwords, JWT tokens, payment credentials
- Never log raw request bodies by default
- Mask PAN, full GSTIN in logs if needed

---

## 4. API Conventions

### Route Structure
```
/api/auth/*           → Authentication (login, register, logout)
/api/public/*         → No auth required (public storefronts, marketplace)
/api/products/*       → Product CRUD (requires JWT + company scope)
/api/orders/*         → Order management
/api/invoices/*       → Invoice + PDF generation
/api/buyers/*         → Buyer management
/api/companies/*      → Company settings
/api/payments/*       → Razorpay payment flows
/api/users/*          → User profile
/api/dashboard/*      → Stats and analytics
/api/developer/*      → Developer-only system management
```

### Response Shape
```json
// Success
{ "success": true, "data": {...} }
{ "items": [...], "total": 42, "page": 1 }

// Error
{ "error": "Human-readable message" }
```

### HTTP Status Codes
- `200` — OK
- `201` — Created
- `400` — Bad request / validation error
- `401` — Not authenticated
- `403` — Forbidden (wrong role or company)
- `404` — Not found
- `500` — Server error (never expose stack trace to client)

---

## 5. Frontend Rules

### No `alert()` or `confirm()`
Always use:
- Toast notifications (via `ToastContext`)
- Inline confirm UI for destructive actions

### CSS Rules
- Always use CSS variables from `index.css` — never hardcode colors
- Never use Tailwind — this project uses custom CSS variables
- Follow existing class naming conventions (`.glass-panel`, `.btn-primary`, etc.)
- Mobile-first always

### State & Context
- Auth state → `AuthContext`
- Cart state → `CartContext`
- Toasts → `ToastContext`
- Do not create new global state mechanisms without approval

### File Organisation
```
pages/platform/     → Public B2B platform pages (no auth)
pages/shop/         → Buyer pages
pages/admin/        → Supplier/admin pages
pages/delivery/     → Delivery staff pages
pages/developer/    → Developer dashboard pages
components/layouts/ → Layout wrappers
components/ui/      → Shared reusable UI components
```

### ESLint Note (CRA version constraint)
When disabling an ESLint rule in this codebase:
```js
// eslint-disable-next-line   ← bare comment, no rule name
```
Not `// eslint-disable-next-line react-hooks/exhaustive-deps` — CRA version doesn't support named rule in disable comments.

---

## 6. Git Workflow

### Branch Naming
```
feature/   → New features (e.g., feature/b2b-platform-v1)
fix/       → Bug fixes (e.g., fix/invoice-pdf-500)
hotfix/    → Production emergency fixes
audit/     → Security/quality audits
```

### Commit Message Format
```
type: short description

Longer explanation if needed.
Bullet list of specific changes.
```
Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Current Branches
| Branch | Status | Purpose |
|--------|--------|---------|
| `master` | Stable | Production base |
| `feature/saas-improvements` | Merged into b2b | SaaS multi-tenancy fixes |
| `feature/b2b-platform-v1` | **Active** | B2B platform landing + marketplace |

---

## 7. Testing Workflow

Before any commit:
1. Start both servers (backend: `localhost:5000`, frontend: `localhost:3000`)
2. Test all URLs listed in `task.md` → "Test Checklist"
3. Check browser console for JS errors
4. Check backend terminal for API errors
5. Confirm with developer → then commit

---

## 8. Environment Rules

- **Development**: Always use `localhost:5000` backend, `localhost:3000` frontend
- **Never** run destructive DB operations against production without explicit instruction
- Neon DB cold starts take 8-15 seconds — always wait for `"Migrations applied"` in backend log before testing
- Backend requires `.env` file — copy from `.env.example` and fill real values

---

## 9. Indian Compliance Rules (Non-Negotiable)

- GST rates must be respected per product (0%, 5%, 12%, 18%, 28%)
- HSN codes required for invoicing
- MSME 45-day payment protection must remain active (cron job)
- Invoice format must include: supplier GSTIN, buyer GSTIN, HSN codes, GST breakup
- GSTIN format: 15-character `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`

---

## 10. What to Always Preserve

Unless explicitly asked to change:
- Multi-tenant company_id scoping
- Buyer route protection (`/shop` = buyer only)
- Admin route protection (`/admin` = admin/supplier only)
- BizFlow branding at `/login` (never show tenant name there)
- MSME cron job
- Audit logging
- Rate limiting on auth endpoints
