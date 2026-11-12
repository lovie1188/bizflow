# BizFlow — B2B SaaS Platform for Indian MSMEs

> A multi-tenant B2B marketplace where suppliers get a branded storefront and buyers get a unified catalog — built for Indian GST/MSME compliance.

**Active Branch:** `feature/b2b-platform-v1`
**GitHub:** https://github.com/lovie1188/bizflow

---

## What is BizFlow?

BizFlow is a B2B SaaS platform that connects Indian MSME suppliers with their buyers/retailers.

- **Suppliers** register, list products, and get a public branded store at `bizflow.in/store/their-name`
- **Buyers** browse supplier catalogs without logging in, then place orders with an account
- **Platform** provides an aggregated marketplace at `/marketplace` (Amazon/Blinkit style)
- **Compliance** built-in: GST invoicing (HSN codes, GSTIN, IRN), MSME 45-day protection, compound interest calculation

---

## Quick Start

```powershell
git clone https://github.com/lovie1188/bizflow.git
cd bizflow
git checkout feature/b2b-platform-v1
```

👉 **See [SETUP.md](SETUP.md) for the full step-by-step setup guide.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, CSS Variables |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT + bcrypt |
| Payments | Razorpay |
| Storage | Google Drive (Service Account) |
| Email | Nodemailer (SMTP) |
| WhatsApp | Twilio (sandbox) |
| Font | Manrope (self-hosted) |

> **No Docker required for development.** Database is cloud-hosted on Neon.

---

## URL Structure

| URL | Description |
|-----|-------------|
| `/` | Platform landing page (B2B marketing) |
| `/marketplace` | Public aggregated product catalog |
| `/store/:storeName` | Individual supplier's public store |
| `/supplier-register` | Supplier self-registration |
| `/login` | Login (BizFlow branding) |
| `/shop/*` | Buyer dashboard (authenticated) |
| `/admin/*` | Supplier/admin dashboard |

---

## Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Supplier/Admin | `admin@bizflow.com` | `password123` |
| Buyer | `buyer1@acmecorp.com` | `password123` |
| Developer | `dev@bizflow.in` | `password123` |

---

## Documentation

| File | Contents |
|------|---------|
| [SETUP.md](SETUP.md) | New machine setup guide |
| [Documents/PRD.md](Documents/PRD.md) | Product requirements |
| [Documents/architecture.md](Documents/architecture.md) | System architecture, DB schema, API structure |
| [Documents/design.md](Documents/design.md) | Design system, colors, typography |
| [Documents/rules.md](Documents/rules.md) | Development rules & conventions |
| [Documents/task.md](Documents/task.md) | Task board, test checklist, known bugs |
| [Documents/memory.md](Documents/memory.md) | Decisions & change history |
| [Documents/api.md](Documents/api.md) | Full API endpoint reference |
| [Documents/env.md](Documents/env.md) | Environment variables guide |
| [Documents/decisions.md](Documents/decisions.md) | Architectural decision records (why things are built this way) |
| [Documents/CHANGELOG.md](Documents/CHANGELOG.md) | Historical changelog |

---

## Indian Compliance Features

- ✅ GST invoices with HSN codes, GSTIN, line-item GST breakup
- ✅ MSME 45-day payment protection (Section 43B(h))
- ✅ Compound interest at 3× RBI Bank Rate (19.5% p.a.) for overdue invoices
- ✅ GSTIN format validation (15-char regex)
- ✅ E-Way Bill fields on dispatch
- ✅ IRN field on invoices (API integration pending)
- ✅ Daily overdue reminder cron (8:00 AM IST)

---

**Last Updated:** November 2026 | **Version:** 2.0
