# BizFlow — Product Requirements Document (PRD)
> Version: 2.0 | Last Updated: November 2026 | Branch: `feature/b2b-platform-v1`

---

## 1. Product Vision

**BizFlow** is a B2B SaaS platform for Indian MSME suppliers and their buyers/retailers.

> "Think Amazon for B2B — a supplier can open a store, list products, and buyers (retailers/distributors) can browse and order without knowing each other beforehand."

### One-line pitch
*A multi-tenant B2B marketplace where suppliers get a branded storefront and buyers get a unified catalog — built for Indian GST/MSME compliance from day one.*

---

## 2. User Types

| Role | Who they are | Primary Goal |
|------|-------------|--------------|
| **Supplier / Admin** | MSME manufacturer or distributor | List products, manage orders, raise invoices, track payments |
| **Buyer / Retailer** | Retailer or distributor placing orders | Browse catalogs, place orders, track invoices, pay online |
| **Delivery Staff** | Logistics staff | View assigned deliveries, update delivery status |
| **Developer** | BizFlow internal team | System monitoring, feature flags, backup management |

---

## 3. Platform Architecture (B2B SaaS)

### 3.1 URL Structure

| URL Pattern | Purpose | Auth Required |
|------------|---------|---------------|
| `bizflow.in/` | Platform landing (marketing) | ❌ Public |
| `bizflow.in/marketplace` | Aggregated product catalog (all suppliers) | ❌ Public |
| `bizflow.in/supplier-register` | Supplier self-registration | ❌ Public |
| `bizflow.in/buyer-register` | Buyer self-registration | ❌ Public |
| `bizflow.in/login` | Login (shows BizFlow branding) | ❌ Public |
| `bizflow.in/store/:storeName` | Individual supplier's public storefront | ❌ Public |
| `bizflow.in/store/:storeName/catalog` | Full public catalog of a supplier | ❌ Public |
| `bizflow.in/store/:storeName/product/:id` | Public product detail | ❌ Public |
| `bizflow.in/shop/*` | Buyer-authenticated area (orders, cart, etc.) | ✅ Buyer only |
| `bizflow.in/admin/*` | Supplier admin dashboard | ✅ Admin/Supplier |
| `bizflow.in/delivery` | Delivery staff dashboard | ✅ Delivery/Staff |
| `bizflow.in/developer` | Developer/system dashboard | ✅ Developer |
| `supplier-domain.com/` | Custom domain → supplier's store | ❌ Public |

### 3.2 Multi-Tenancy Model
- Each **company** = one tenant
- Data is strictly scoped by `company_id` on every query
- JWT tokens carry `{ userId, role, companyId }` — backend enforces company scope on every protected route
- Suppliers get a unique `store_slug` (auto-generated from company name: e.g., "Charu Marketing" → `charumar`)
- Custom domain support via `custom_domain` column in companies table

---

## 4. Features — Current (v1)

### 4.1 Supplier (Admin) Features
- [x] Company registration with GSTIN validation
- [x] Product management (CRUD, images, HSN/GST codes, stock, MOQ)
- [x] Buyer management (credit limits, MSME fields, risk score, agreements)
- [x] Order management (create, dispatch, deliver, cancel)
- [x] Invoice generation (PDF, IRN placeholder, E-way bill fields)
- [x] Payment tracking (manual + Razorpay online)
- [x] GST-compliant invoicing (HSN codes, GST rates per line item)
- [x] MSME 45-day overdue reminder (daily cron, compound interest at 3x RBI rate)
- [x] Staff management (add delivery/staff users)
- [x] Audit logs (every significant action logged)
- [x] Google Drive backup for agreements and product images
- [x] Store URL panel in settings (copy + open store link)
- [x] Voice notifications for overdue invoices

### 4.2 Buyer Features
- [x] Browse supplier catalog (no login required for public store)
- [x] Add to cart, checkout, place order
- [x] View orders, invoices, purchase orders
- [x] Pay online via Razorpay
- [x] View & download invoices as PDF
- [x] Profile management

### 4.3 Platform / Public Features
- [x] Platform landing page (`/`) — B2B marketing page
- [x] Aggregated marketplace (`/marketplace`) — all suppliers' products + supplier directory
- [x] Public supplier storefront (`/store/:storeName`)
- [x] Supplier self-registration (`/supplier-register`)
- [x] SaaS branding — BizFlow at `/login`, tenant name at `/store/:storeName`

### 4.4 Developer / Ops
- [x] Feature flags (Razorpay, WhatsApp, SMS — global on/off)
- [x] Subscription/plan management per company
- [x] Backup service (PostgreSQL exports + Google Drive upload)
- [x] Rate limiting (global: 300/15min; auth: 10/15min)
- [x] Helmet security headers, CORS whitelist

---

## 5. Features — Planned (v2 / Backlog)

| Feature | Priority | Notes |
|---------|----------|-------|
| Supplier dashboard analytics | High | Sales charts, top buyers, revenue trends |
| WhatsApp notifications | High | Twilio integrated but globally disabled |
| SMS notifications | Medium | Twilio SMS, globally disabled |
| Product review system | Medium | Buyer rates products per supplier |
| Buyer RFQ (Request for Quote) | Medium | Buyer sends inquiry to multiple suppliers |
| Public product detail page | Medium | `/store/:storeName/product/:id` wired but needs UX polish |
| Mobile app | Low | React Native scaffold exists in `mobile/` |
| Subscription billing (Razorpay) | High | Plans: Starter/Growth/Enterprise |
| IRN / E-invoice integration | Medium | IRN field exists, API integration pending |
| Multi-warehouse / locations | Low | — |
| Supplier analytics marketplace | Low | Aggregate insights across platform |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Database | Neon PostgreSQL (serverless, cold start ~10-15s on dev) |
| Auth | JWT, 7-day expiry for admin, 30-day for buyer |
| File storage | Google Drive via Service Account |
| Payments | Razorpay (test + live mode) |
| Email | Nodemailer SMTP (Gmail / Zoho) |
| WhatsApp | Twilio (sandbox) |
| Rate limiting | 300 req/15min global, 10 req/15min on auth |
| Security | Helmet, CORS whitelist, JWT company scoping, bcrypt passwords |
| Logging | Centralized logger, error.log file, audit_logs table in DB |
| Indian compliance | GST (HSN codes, rates, invoice format), MSME 45-day protection |
