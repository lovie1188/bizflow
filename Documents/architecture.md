# BizFlow — System Architecture
> Version: 2.0 | Last Updated: November 2026

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 (CRA), React Router v6, CSS Variables (no Tailwind) |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL via Neon (serverless) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **File Storage** | Google Drive API (Service Account) |
| **Payments** | Razorpay |
| **Email** | Nodemailer (SMTP — Gmail / Zoho) |
| **WhatsApp** | Twilio WhatsApp Sandbox |
| **PDF** | Custom HTML→PDF renderer (pdfGenerator.js) |
| **Cron Jobs** | node-cron |
| **Containerisation** | Docker + docker-compose (available, not mandatory for dev) |
| **Font** | Manrope (self-hosted WOFF2 in `/public/fonts/`) |

---

## 2. Repository Structure

```
bizflow/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point, middleware, DB init, migrations
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify, role check, company scope
│   │   │   ├── featureGate.js     # Feature flag middleware
│   │   │   └── validate.js        # Input validation helpers
│   │   ├── routes/
│   │   │   ├── public.js          # Unauthenticated public APIs
│   │   │   ├── auth.js            # /register, /login, /logout
│   │   │   ├── products.js        # Supplier product CRUD
│   │   │   ├── orders.js          # Order lifecycle
│   │   │   ├── invoices.js        # Invoice generation + PDF
│   │   │   ├── buyers.js          # Buyer management
│   │   │   ├── companies.js       # Company settings + store slug
│   │   │   ├── payments.js        # Razorpay integration
│   │   │   ├── users.js           # User profile
│   │   │   ├── dashboard.js       # Stats + analytics
│   │   │   ├── notifications.js   # Email/WhatsApp triggers
│   │   │   ├── subscriptions.js   # Plan management
│   │   │   ├── featureCatalog.js  # Feature flag catalog
│   │   │   ├── auditLogs.js       # Audit log viewer
│   │   │   ├── export.js          # Data export
│   │   │   ├── settings.js        # System settings (developer)
│   │   │   ├── developer.js       # Developer dashboard APIs
│   │   │   └── consentRecords.js  # GDPR/consent tracking
│   │   ├── utils/
│   │   │   ├── db.js              # pg Pool with Neon retry logic
│   │   │   ├── logger.js          # Centralized logger
│   │   │   ├── audit.js           # logAudit() helper
│   │   │   ├── pdfGenerator.js    # Invoice PDF generation
│   │   │   ├── googleDriveService.js # Drive uploads
│   │   │   ├── notifications.js   # Email/WhatsApp send helpers
│   │   │   ├── sanitize.js        # Input sanitization
│   │   │   └── tokenBlacklist.js  # JWT logout blacklist
│   │   ├── jobs/
│   │   │   └── overdueReminder.js # MSME 45-day cron job (daily 8AM IST)
│   │   └── services/
│   │       └── backupService.js   # DB backup + Drive upload
│   ├── uploads/                   # Local product image uploads
│   ├── logs/
│   │   └── error.log
│   ├── .env                       # ⚠️ NOT in git — copy from .env.example
│   ├── .env.example               # Template with all required vars
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router — all routes defined here
│   │   ├── index.css              # Design tokens (CSS variables), global styles
│   │   ├── components/
│   │   │   ├── Logo.jsx           # BizFlow logo — name priority: prop → company → 'BizFlow'
│   │   │   ├── ProtectedRoute.jsx # Route guard (publicOnly, allowedRoles)
│   │   │   ├── ErrorBoundary.jsx  # Global error catch
│   │   │   ├── layouts/
│   │   │   │   ├── ShopLayout.jsx # Buyer/public layout (fetches tenant name for /store/:slug)
│   │   │   │   └── AdminLayout.jsx# Supplier/admin layout with sidebar
│   │   │   └── ui/               # Shared UI components
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state, login/logout
│   │   │   ├── CartContext.jsx    # Shopping cart state
│   │   │   └── ToastContext.jsx   # Global toast notifications
│   │   ├── pages/
│   │   │   ├── platform/          # Public B2B platform pages
│   │   │   │   ├── PlatformLanding.jsx   # / — marketing landing
│   │   │   │   ├── Marketplace.jsx       # /marketplace — aggregated catalog
│   │   │   │   └── SupplierRegister.jsx  # /supplier-register
│   │   │   ├── shop/              # Buyer-facing pages
│   │   │   │   ├── ShopHome.jsx   # /shop or /store/:storeName (public mode auto-detected)
│   │   │   │   ├── ProductCatalog.jsx
│   │   │   │   ├── ProductDetail.jsx
│   │   │   │   ├── Cart.jsx
│   │   │   │   ├── Checkout.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── BuyerRegister.jsx
│   │   │   │   ├── BuyerOrders.jsx
│   │   │   │   ├── OrderDetails.jsx
│   │   │   │   ├── BuyerInvoices.jsx
│   │   │   │   ├── BuyerPurchaseOrders.jsx
│   │   │   │   ├── BuyerProfile.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── ResetPassword.jsx
│   │   │   ├── admin/             # Supplier/admin pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminProducts.jsx
│   │   │   │   ├── AdminOrders.jsx
│   │   │   │   ├── AdminBuyers.jsx
│   │   │   │   ├── AdminInvoices.jsx
│   │   │   │   ├── AdminStaff.jsx
│   │   │   │   └── AdminSettings.jsx  # Includes Store URL panel
│   │   │   ├── delivery/
│   │   │   │   └── DeliveryDashboard.jsx
│   │   │   └── developer/
│   │   │       └── DeveloperDashboard.jsx
│   │   └── utils/
│   │       ├── api.js             # API_URL export
│   │       └── voiceNotifier.js   # Web Speech API wrapper
│   └── public/
│       ├── fonts/                 # Manrope self-hosted WOFF2
│       ├── hero-banner.png
│       └── index.html
│
├── Documents/                     # Project documentation
│   ├── PRD.md
│   ├── architecture.md
│   ├── design.md
│   ├── rules.md
│   ├── task.md
│   ├── memory.md
│   └── CHANGELOG.md
├── mobile/                        # React Native scaffold (not production-ready)
├── docker-compose.yml
└── .agents/AGENTS.md              # AI coding agent rules
```

---

## 3. Database Schema

### Core Tables

```sql
companies          -- One per supplier/tenant
  id, name, gstin, email, phone, address, city, state, pincode
  invoice_prefix, setup_complete, plan, active, created_at
  store_slug         -- e.g. "charumar" (auto-generated, editable)
  custom_domain      -- e.g. "shop.charumarketing.com"
  stripe_customer_id

users              -- All user types (admin/buyer/delivery/developer)
  id, name, email, password_hash, role, active, created_at

user_companies     -- Junction: user ↔ company (supports multi-company)
  user_id, company_id, role

buyers             -- Buyer entities (the B2B buyer companies, not user accounts)
  id, company_id, name, gstin, pan, phone, email
  credit_limit, used_credit, risk_score, status
  msme_no, msme_type, agreement_signed, agreement_url

products           -- Per-company product catalog
  id, company_id, sku, name, description
  hsn_code, gst_rate, unit, buy_price, trade_price
  stock, min_order_qty, image_url, category, brand

orders             -- Order header
  id, company_id, order_number, buyer_id, buyer_entity_id
  total_amount, subtotal, gst_amount, grand_total
  status, paid, dispatch_date, vehicle_no, transporter
  ewb_no, ewb_validity, delivery_address, notes

order_items        -- Order line items
  id, order_id, product_id, qty, unit_price, gst_rate, hsn_code
  amount, gst_amount, total

invoices           -- GST invoices
  id, company_id, order_id, buyer_entity_id
  invoice_number, irn, irn_status, qr_code, ewb_no
  amount, due_date, paid, payment_days
  msme_protected, agreement_type

payments           -- Payment records (manual + Razorpay)
  id, company_id, invoice_id, amount
  payment_method, transaction_id, status

bank_accounts      -- Supplier bank/UPI details
notifications      -- Email/WhatsApp send history
consent_records    -- GDPR consent tracking
system_settings    -- Global feature flags (key/value)
company_subscriptions -- Per-company feature subscriptions/plans
audit_logs         -- Every significant action (who, what, when)
```

### Slug Generation Logic
Auto-generated in `server.js` migration:
```sql
UPDATE companies
SET store_slug = LOWER(
  SPLIT_PART(name, ' ', 1) ||
  SUBSTRING(SPLIT_PART(name, ' ', 2), 1, 3)
)
WHERE store_slug IS NULL;
-- "Charu Marketing" → "charumar"
-- "ABC Enterprises" → "abcent"
```

---

## 4. API Architecture

### Base URL
- Dev: `http://localhost:5000`
- Prod: `https://api.bizflow.in` (or same-origin via reverse proxy)

### Auth Pattern
All protected endpoints use:
```
Authorization: Bearer <JWT>
```
JWT payload: `{ userId, role, companyId }`

Backend middleware (`auth.js`) extracts `companyId` and scopes every query automatically.

### Key Public Endpoints (no auth)
```
GET  /api/public/store/:storeName          → Company info by slug or name
GET  /api/public/store/:storeName/products → Products for that store
GET  /api/public/domain/:hostname          → Company info by custom domain
GET  /api/public/suppliers                 → All companies + product counts
GET  /api/public/marketplace/products      → Aggregated cross-supplier catalog
                                             ?search=&category=&supplier_id=&page=&limit=
```

### Key Auth Endpoints
```
POST /api/auth/register   → Create company + admin user (transaction)
POST /api/auth/login      → Returns JWT
POST /api/auth/logout     → Blacklists JWT
POST /api/auth/register-buyer → Register buyer user
```

---

## 5. Frontend Architecture

### State Management
- **Auth**: `AuthContext` — stores JWT, user, company; persisted in `localStorage`
- **Cart**: `CartContext` — shopping cart state
- **Toast**: `ToastContext` — global toast notification system

### Route Guard Pattern
```jsx
// Public only (redirect logged-in users away)
<ProtectedRoute publicOnly>...</ProtectedRoute>

// Role-gated
<ProtectedRoute allowedRoles={['admin', 'supplier']}>...</ProtectedRoute>
```

### Branding Logic
```
Logo name priority: nameProp → company?.name → 'BizFlow'

/login          → shows "BizFlow" (no company in context) ✅
/store/charumar → ShopLayout fetches tenant name → shows "Charu Marketing" ✅
/admin          → AdminLayout has company from auth context ✅
```

### Custom Domain Detection
```js
const isCustomDomain = hostname !== 'localhost' && !hostname.includes('bizflow.in');
// If true: root / shows that supplier's ShopHome
// If false: root / shows PlatformLanding
```

---

## 6. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Auth | JWT with company scope; short expiry (7d admin, 30d buyer) |
| Passwords | bcrypt, 10 rounds |
| Rate limiting | Global: 300/15min; Auth: 10/15min |
| CORS | Whitelist via CORS_ORIGIN env var; blocks all others |
| Headers | Helmet (noSniff, XSS, frameguard, HSTS in prod, CSP) |
| Input | Server-side validation + sanitize.js |
| SQL | Parameterised queries via `pg` library — no raw concatenation |
| File uploads | UUID filenames, type validation, stored outside web root |
| Secrets | .env gitignored; Google SA JSON gitignored |
| Audit | Every significant action logged to `audit_logs` table |
| Logout | JWT blacklisted in `tokenBlacklist` (in-memory, TTL-based) |

---

## 7. Environments

| Environment | Frontend | Backend | Database |
|------------|---------|---------|---------|
| **Development** | `localhost:3000` (CRA dev server) | `localhost:5000` | Neon PostgreSQL (remote) |
| **Production** | Nginx static serve OR hosting platform | Node.js process | Neon PostgreSQL (or dedicated PG) |
| **Docker** | Dockerfile present | Dockerfile present | docker-compose PG service |

### Dev Server Start
```powershell
# Backend
cd D:\xampp\htdocs\bizflow\backend
node src/server.js
# Wait for: "Migrations applied" before testing

# Frontend
cd D:\xampp\htdocs\bizflow\frontend
npm start
# Hot-reloads on save
```
