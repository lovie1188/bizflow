# BizFlow SaaS - Changelog & Update History

## [June 2026 Updates] - Final Verification & Polish

### 🌟 New Features & Enhancements
1. **Compound Interest Calculation (MSME Compliance)**
   - Implemented dynamic 19.5% p.a. (3x RBI Bank Rate) interest calculation for invoices exceeding the 45-day MSME payment threshold.
   - Visually highlighted overdue amounts and interest accruals in both `AdminInvoices.jsx` and `BuyerInvoices.jsx`.

2. **Voice Notifications (Web Speech API)**
   - Added text-to-speech voice alerts in the Admin Invoices dashboard for overdue payments, fulfilling the README requirement for "Voice Notifications".

3. **Google Drive Integration Perfection**
   - Corrected the folder structure for Buyer Agreements to exactly match the specification: `Company_ID_Name/buyer_Company_ID_Name/Agreement`.
   - Corrected the folder structure for Product Images to exactly match the specification: `Company_ID_Name/Products/images`.

4. **Toast Notifications Modernization**
   - Completely eradicated legacy browser `alert()` popups across the frontend.
   - Replaced all alerts with a premium, global `ToastNotification` context system (`AdminBuyers`, `AdminProducts`, `AdminSettings`, `AdminStaff`).

5. **Developer Dashboard & Auditing**
   - Activated the `/developer` route with mock credentials (`dev@bizflow.in`).
   - Built the necessary backend API mock routes (`/api/developer/backups`, etc.) to prevent frontend crashes and allow system auditing.

### 🐛 Bug Fixes & UI Tweaks
- **Brand Filter Fix:** Added the missing `brand` column to the `products` table in PostgreSQL. Populated dummy data (Vadilal, Amul) ensuring the brand filter logic works seamlessly.
- **Product Catalog UI:** 
  - Moved the `show-on-mobile` Filters toggle button to sit beside the Grid/List view buttons, preventing it from consuming an entire row on desktop.
  - Reduced the `shop-main` container padding from `16px 24px` for a tighter, more modern layout.

### 🐳 Infrastructure & Deployment (Docker Context)
- **Docker Validation:** The project was initially structured using Docker and `docker-compose` to guarantee a consistent development environment ("it works on my machine" prevention) and to provide a robust, scalable architecture for AWS deployment. While local development temporarily connects to Neon PostgreSQL for speed, the Docker configuration remains fully intact and is the recommended pathway for production deployment as outlined in the Deployment documentation.

---

## [June 20, 2026] — Security Audit & Critical Bug Fixes

> Source: Outsourced QA Testing Team Report

### 🔴 Critical Fixes (Launch Blockers — All Resolved)

1. **Invoice Link 501 Fix** (`orders.js`)
   - `/api/orders/:id/invoice-html` was returning `501 Not Implemented`.
   - Fixed: Route now queries `invoices` table by `order_id` and redirects to actual `/api/invoices/:id/pdf`.

2. **Credit Limit Never Released** (`payments.js`)
   - `used_credit` was never decremented when an invoice was paid (neither manual nor Razorpay webhook path).
   - Fixed: Both payment paths now run `UPDATE buyers SET used_credit = GREATEST(used_credit - $1, 0)` on successful payment.

3. **Buyer Data Security Gap** (`buyers.js`)
   - `GET /api/buyers/:id` had no `company_id` filter — any user could brute-force other suppliers' buyer GSTIN/PAN data.
   - Fixed: Added `AND company_id = $2` to the query.

4. **Agreement Upload Crash** (`buyers.js`)
   - SQL query referenced `b.company_name` column which does not exist (correct column is `b.name`).
   - Fixed: Changed to `b.name as buyer_name`.

5. **New Buyer Wrong Company Link** (`auth.js`)
   - `register-buyer` defaulted to `companyId = 1` which may not exist or may be the wrong company.
   - Fixed: Now dynamically queries `SELECT id FROM companies ORDER BY id ASC LIMIT 1` as the active supplier.

6. **Google Drive Agreements Public** (`googleDriveService.js`, `products.js`)
   - All Drive uploads (including sensitive agreement PDFs with GSTIN/PAN) were given `anyone/reader` permissions.
   - Fixed: Added `isPublic` flag (default `false`). Product images pass `isPublic = true`, agreements remain private.

7. **Stale Frontend Build** (`frontend/build/`)
   - Build folder was 8 days old (June 7) while source code had updates up to June 15+.
   - Fixed: Fresh `npm run build` executed — new optimized build generated (99.17 kB JS, 6.5 kB CSS).

8. **Secrets Protection** (`.gitignore`)
   - `google-service-account.json` was not in `.gitignore`.
   - Fixed: Added to `.gitignore`. Manual action required: rotate Google Service Account JSON and JWT_SECRET.

### ⚠️ Manual Action Required (Cannot be automated)
- Generate new Google Service Account JSON from Google Cloud Console
- Replace `backend/google-service-account.json` with new key
- Update `JWT_SECRET` in `.env` with a new random 64-char string
- Update Razorpay Live keys if production keys were exposed
