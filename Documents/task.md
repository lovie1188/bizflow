# BizFlow — Task Board & Backlog
> Last Updated: November 12, 2026 | Active Branch: `feature/b2b-platform-v1`

---

## ✅ Completed (This Session / Recent)

### Sprint: B2B Platform + SaaS Fixes
| # | Task | Branch | Commit |
|---|------|--------|--------|
| 1 | SaaS branding fix — BizFlow at `/login`, tenant name at `/store/:slug` | b2b-platform-v1 | 848487b |
| 2 | `store_slug` + `custom_domain` DB migration + auto-backfill | b2b-platform-v1 | 848487b |
| 3 | Public API: `GET /api/public/suppliers` | b2b-platform-v1 | 848487b |
| 4 | Public API: `GET /api/public/marketplace/products` (with filters) | b2b-platform-v1 | 848487b |
| 5 | `PlatformLanding.jsx` — B2B marketing landing at `/` | b2b-platform-v1 | 848487b |
| 6 | `Marketplace.jsx` — Aggregated catalog at `/marketplace` | b2b-platform-v1 | 848487b |
| 7 | `SupplierRegister.jsx` — Self-registration at `/supplier-register` | b2b-platform-v1 | 848487b |
| 8 | `App.jsx` — All new routes wired up | b2b-platform-v1 | 848487b |
| 9 | AdminSettings store URL panel (copy + open) | b2b-platform-v1 | 848487b |
| 10 | Store slug CRUD in companies API | b2b-platform-v1 | 848487b |
| 11 | Products 500 fix (removed `updated_at` from publicFields) | saas-improvements | bf6d847 |
| 12 | `window.confirm` → inline confirm on 6 admin pages | saas-improvements | bf6d847 |
| 13 | Multi-tenant JWT scoping for products | saas-improvements | bf6d847 |
| 14 | Neon DB resilience (retry logic, timeout) | saas-improvements | bf6d847 |

---

## 🔴 High Priority — Next Sprint

| # | Task | Notes |
|---|------|-------|
| H1 | **Store Not Found page** | When `/store/:slug` API returns 404, show proper "Store Not Found" UI instead of empty shell |
| H2 | **Supplier dashboard analytics** | Sales charts, top buyers, revenue over time, top products |
| H3 | **Subscription billing flow** | Razorpay subscriptions for Starter/Growth/Enterprise plans |
| H4 | **WhatsApp notifications enable** | Globally disabled; needs Twilio WhatsApp Business approval then enable |
| H5 | **Email notifications testing** | SMTP setup + test overdue reminders, order confirmations |

---

## 🟡 Medium Priority — Upcoming

| # | Task | Notes |
|---|------|-------|
| M1 | Public product detail page UX | `/store/:storeName/product/:id` route exists but needs "Login to Order" CTA design polish |
| M2 | Buyer RFQ flow | Buyer sends inquiry to supplier from public store |
| M3 | Product review/rating system | Buyer rates products after order delivery |
| M4 | IRN / E-invoice API integration | IRN field in DB; needs NIC/IRP API hookup |
| M5 | Marketplace search improvement | Full-text search, autocomplete |
| M6 | Supplier profile page on marketplace | Richer store profile: about, logo, categories, contact |
| M7 | Custom domain setup UI | Let admin configure custom domain in settings |
| M8 | Mobile app (React Native) | Scaffold in `mobile/` — not production-ready |

---

## 🟢 Low Priority / Future

| # | Task | Notes |
|---|------|-------|
| L1 | Multi-warehouse / location support | — |
| L2 | Supplier marketplace analytics | Aggregate across platform |
| L3 | Buyer credit scoring improvements | Auto risk score based on payment history |
| L4 | Google Sheets export | Buyers/orders/products to Google Sheets |
| L5 | Barcode / QR code on products | For inventory management |
| L6 | Dark mode | CSS variables make this feasible |
| L7 | SMS notifications | Twilio SMS, globally disabled |

---

## 🧪 Test Checklist (Before Any Commit)

Run through these URLs after every significant change:

### Public (No Login)
- [ ] `http://localhost:3000/` → Platform landing page loads, shows stats
- [ ] `http://localhost:3000/marketplace` → Products + Suppliers tabs work
- [ ] `http://localhost:3000/supplier-register` → Form works, submits to API
- [ ] `http://localhost:3000/store/charumar` → Charu Marketing store, 8 products
- [ ] `http://localhost:3000/store/charumar/catalog` → Full product catalog
- [ ] `http://localhost:3000/store/nonexistent` → Should show "Store Not Found" (H1 pending)

### Auth
- [ ] `http://localhost:3000/login` → Shows "BizFlow" branding (NOT tenant name)
- [ ] Login as admin (`admin@bizflow.com` / `password123`) → goes to `/admin`
- [ ] Login as buyer (`buyer1@acmecorp.com` / `password123`) → goes to `/shop`
- [ ] Login as dev (`dev@bizflow.in` / `password123`) → goes to `/developer`

### Admin (Supplier)
- [ ] `/admin` → Dashboard stats load
- [ ] `/admin/products` → Product list loads, add/edit/delete works
- [ ] `/admin/orders` → Order list loads
- [ ] `/admin/settings` → Store URL panel visible, slug editable

### Buyer
- [ ] `/shop` → Home, featured products load
- [ ] `/shop/catalog` → Full catalog with filters
- [ ] `/shop/cart` → Cart works
- [ ] `/shop/orders` → Order history

---

## 🐛 Known Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| B1 | `/store/nonexistent` renders empty shell instead of 404 page | Medium | Open (H1 above) |
| B2 | `custom_domain` in DB has trailing space for Charu Marketing (`"localhost/bizflow/charu "`) | Low | Known, cleanup needed |
| B3 | Neon DB cold starts cause 10-15s delay on first request | Infrastructure | Accepted (dev environment) |

---

## 📋 Development Credentials (Dev Environment Only)

| Role | Email | Password |
|------|-------|----------|
| Supplier/Admin | `admin@bizflow.com` | `password123` |
| Buyer | `buyer1@acmecorp.com` | `password123` |
| Developer | `dev@bizflow.in` | `password123` |

> ⚠️ These are development-only credentials. Never use in production.

---

## 🔧 Quick Commands

```powershell
# Start backend
cd D:\xampp\htdocs\bizflow\backend
node src/server.js

# Start frontend
cd D:\xampp\htdocs\bizflow\frontend
npm start

# Check git status
cd D:\xampp\htdocs\bizflow
git status

# Switch to active branch
git checkout feature/b2b-platform-v1

# Create new feature branch
git checkout -b feature/your-feature-name

# Stage + commit (always confirm before pushing)
git add -A
git commit -m "feat: description"
git push -u origin feature/your-feature-name
```
