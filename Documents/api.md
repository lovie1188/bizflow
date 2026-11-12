# BizFlow — API Reference
> All endpoints, auth requirements, and example payloads.
> Base URL (dev): `http://localhost:5000`
> Last Updated: November 2026

---

## Authentication

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

JWT is returned on login/register. Payload: `{ userId, role, companyId }`

**Roles:** `admin`, `supplier`, `buyer`, `delivery`, `staff`, `developer`

---

## Public Endpoints (No Auth)

### Store / Tenant Lookup

#### `GET /api/public/store/:storeName`
Returns company info by `store_slug` OR company `name` (case-insensitive).
```json
// Response 200
{
  "id": 1,
  "name": "Charu Marketing",
  "store_slug": "charumar",
  "city": "Mumbai",
  "state": "Maharashtra"
}
// Response 404
{ "error": "Store not found" }
```

#### `GET /api/public/store/:storeName/products`
Public product list for a supplier's store.
```
?page=1&limit=24
```
```json
// Response
{
  "products": [
    { "id": 1, "name": "...", "trade_price": 120, "stock": 50, "category": "FMCG", "image_url": "..." }
  ],
  "total": 8,
  "page": 1
}
```

#### `GET /api/public/domain/:hostname`
Lookup by custom domain (for custom domain support).
```json
// Response same shape as /store/:storeName
```

#### `GET /api/public/domain/:hostname/products`
Products for a custom domain store.

#### `GET /api/public/suppliers`
All registered supplier companies with product counts.
```json
// Response
[
  { "id": 1, "name": "Charu Marketing", "store_slug": "charumar", "city": "Mumbai", "product_count": 8 }
]
```

#### `GET /api/public/marketplace/products`
Aggregated cross-supplier product catalog.
```
?search=sugar
?category=FMCG
?supplier_id=1
?page=1
?limit=24
```
```json
// Response
{
  "products": [
    {
      "id": 1,
      "name": "...",
      "trade_price": 120,
      "category": "FMCG",
      "image_url": "...",
      "company_id": 1,
      "company_name": "Charu Marketing",
      "store_slug": "charumar"
    }
  ],
  "total": 32,
  "page": 1
}
```

---

## Auth Endpoints

Rate limited: **10 requests / 15 minutes** per IP.

#### `POST /api/auth/register`
Register a new supplier company + admin user (transaction).
```json
// Request
{
  "companyName": "My Company Pvt Ltd",
  "gstin": "29ABCDE1234F1Z5",
  "email": "admin@mycompany.com",
  "password": "securepassword123"
}
// Response 200
{
  "success": true,
  "token": "eyJhbGc...",
  "company": { "id": 2, "name": "My Company Pvt Ltd", "gstin": "29ABCDE1234F1Z5" },
  "message": "Company registered successfully"
}
// Response 400 — GSTIN exists, email exists, invalid GSTIN format, etc.
{ "error": "..." }
```

#### `POST /api/auth/login`
```json
// Request
{ "email": "admin@bizflow.com", "password": "password123" }
// Response 200
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "name": "...", "email": "...", "role": "admin" },
  "company": { "id": 1, "name": "Charu Marketing" }
}
```

#### `POST /api/auth/logout`
```json
// Request — requires Authorization header
{}
// Response 200
{ "message": "Logged out successfully" }
```

#### `POST /api/auth/register-buyer`
Register a buyer user linked to a company.
```json
// Request
{
  "name": "Buyer Name",
  "email": "buyer@acmecorp.com",
  "password": "password123",
  "companyName": "ACME Corp"
}
```

#### `POST /api/auth/forgot-password`
```json
// Request
{ "email": "admin@bizflow.com" }
```

#### `POST /api/auth/reset-password`
```json
// Request
{ "token": "reset_token_from_email", "password": "newpassword123" }
```

---

## Products (Supplier — Auth Required)

> All endpoints scoped to `companyId` from JWT.

#### `GET /api/products`
```
?page=1&limit=20&search=sugar&category=FMCG&brand=Amul
```

#### `POST /api/products`
```json
{
  "sku": "SKU001",
  "name": "Product Name",
  "description": "...",
  "hsn_code": "1704",
  "gst_rate": 18,
  "unit": "kg",
  "buy_price": 100,
  "trade_price": 120,
  "stock": 500,
  "min_order_qty": 10,
  "category": "FMCG",
  "brand": "BrandName"
}
```

#### `PUT /api/products/:id`
Same body as POST. Only updates provided fields.

#### `DELETE /api/products/:id`

#### `POST /api/products/:id/image`
Multipart form upload. Field name: `image`. Returns `{ image_url: "..." }`.

---

## Orders (Supplier — Auth Required)

#### `GET /api/orders`
```
?page=1&status=pending&buyer_id=1&search=ORD-001
```

#### `POST /api/orders`
```json
{
  "buyer_entity_id": 1,
  "items": [
    { "product_id": 1, "qty": 10, "unit_price": 120 }
  ],
  "delivery_address": "...",
  "notes": "..."
}
```

#### `GET /api/orders/:id`

#### `PUT /api/orders/:id/status`
```json
{ "status": "confirmed" }
// Valid statuses: pending, confirmed, dispatched, delivered, cancelled
```

#### `PUT /api/orders/:id/dispatch`
```json
{
  "dispatch_date": "2026-11-15",
  "vehicle_no": "MH01AB1234",
  "transporter": "Blue Dart",
  "ewb_no": "1234567890",
  "ewb_validity": "2026-11-20"
}
```

#### `GET /api/orders/:id/invoice-html`
Returns invoice HTML or redirects to PDF.

---

## Invoices (Supplier — Auth Required)

#### `GET /api/invoices`
```
?page=1&paid=false&overdue=true
```

#### `GET /api/invoices/:id`

#### `GET /api/invoices/:id/pdf`
Returns PDF binary (Content-Type: application/pdf).

#### `PUT /api/invoices/:id/pay`
```json
{ "payment_method": "upi", "transaction_id": "TXN123" }
```

---

## Buyers (Supplier — Auth Required)

#### `GET /api/buyers`

#### `POST /api/buyers`
```json
{
  "name": "Buyer Company Name",
  "phone": "9876543210",
  "email": "buyer@company.com",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "city": "Mumbai",
  "state": "Maharashtra",
  "address": "...",
  "pincode": "400001",
  "business_type": "retailer",
  "credit_limit": 100000,
  "msme_no": "UDYAM-MH-00-0000001",
  "msme_type": "micro"
}
```

#### `PUT /api/buyers/:id`

#### `GET /api/buyers/:id`

#### `PUT /api/buyers/:id/status`
```json
{ "status": "approved" }
// Valid: pending, approved, suspended
```

#### `POST /api/buyers/:id/agreement`
Multipart upload of signed agreement PDF. Field: `agreement`.

---

## Companies / Settings (Admin — Auth Required)

#### `GET /api/companies/settings`
Returns current company's full settings.

#### `PUT /api/companies/settings`
```json
{
  "name": "Company Name",
  "gstin": "29ABCDE1234F1Z5",
  "email": "info@company.com",
  "phone": "9876543210",
  "address": "...",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "invoice_prefix": "INV",
  "store_slug": "mystore"
}
```
> `store_slug` must be unique, lowercase, alphanumeric + hyphens only.

#### `GET /api/companies/bank-accounts`
#### `POST /api/companies/bank-accounts`
```json
{
  "account_name": "Current Account",
  "bank_name": "HDFC Bank",
  "account_no": "XXXXXXXXXXXX",
  "ifsc": "HDFC0001234",
  "upi_id": "company@hdfcbank",
  "is_default": true
}
```

---

## Dashboard (Admin — Auth Required)

#### `GET /api/dashboard/stats`
Returns KPIs: total orders, revenue, pending invoices, overdue amount, etc.

#### `GET /api/dashboard/recent-orders`
#### `GET /api/dashboard/top-products`
#### `GET /api/dashboard/revenue-chart`
```
?period=30d
```

---

## Payments (Auth Required)

#### `POST /api/payments/create-order`
Creates a Razorpay order for an invoice.
```json
{ "invoice_id": 1 }
// Response: { "razorpay_order_id": "order_xxx", "amount": 10000, "currency": "INR" }
```

#### `POST /api/payments/verify`
Verifies Razorpay payment signature after frontend payment.
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "xxx"
}
```

#### `POST /api/payments/webhook`
Razorpay webhook endpoint (no auth — uses signature verification).

---

## Users (Auth Required)

#### `GET /api/users/profile`
Returns current user's profile.

#### `PUT /api/users/profile`
```json
{ "name": "New Name", "email": "new@email.com" }
```

#### `PUT /api/users/change-password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## Notifications (Admin — Auth Required)

#### `POST /api/notifications/send-reminder`
```json
{ "invoice_id": 1, "type": "whatsapp" }
```

---

## Developer Endpoints (Developer Role Only)

#### `GET /api/developer/stats`
System-wide stats across all companies.

#### `GET /api/developer/companies`
All companies with plan info.

#### `PUT /api/developer/feature-flags`
```json
{ "razorpay_globally_enabled": "true", "whatsapp_globally_enabled": "false" }
```

#### `POST /api/developer/backups`
Triggers manual backup.

#### `GET /api/developer/audit-logs`
```
?page=1&company_id=1&action=Login
```

---

## Error Responses

All errors return:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation failed |
| `401` | Missing or invalid JWT |
| `403` | Valid JWT but wrong role or company |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Server error (check backend logs) |
