# BizFlow — Environment Variables Guide
> Where to find every credential and what it does.
> Last Updated: November 2026

---

## How to Set Up

```powershell
cd bizflow/backend
copy .env.example .env
# Then edit .env with real values
```

The frontend has only one env file: `frontend/.env.development.local` (already committed, only contains `HOST=0.0.0.0`). The frontend reads `API_URL` from `frontend/src/utils/api.js` which defaults to `http://localhost:5000` in development.

---

## All Backend Variables

### Core

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `development` | ✅ | Set to `production` on live server |
| `PORT` | `5000` | ✅ | Backend server port |

### Database

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | ✅ | Neon PostgreSQL connection string |

**Where to get it:**
1. Go to https://console.neon.tech
2. Select your project → `bizflow`
3. Click **Connection Details**
4. Copy the connection string (with `?sslmode=require` at the end)
5. Use the **pooled** connection string for production

### Authentication

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET` | `a94f2c3d...` (64 hex chars) | ✅ | Signs all JWT tokens |
| `JWT_EXPIRE` | `30d` | ✅ | Token expiry for buyers |
| `JWT_EXPIRES_IN_ADMIN` | `7d` | ⚡ Optional | Token expiry for admin/supplier (defaults to 7d) |

**Generate a secure JWT_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> ⚠️ **Never reuse the same JWT_SECRET across environments.** Generate a new one for each machine/environment.

### CORS / Frontend

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `CORS_ORIGIN` | `http://localhost:3000` | ✅ | Frontend URL allowed to call the API |
| `FRONTEND_URL` | `http://localhost:3000` | ✅ | Used in email links |

**Multiple origins (comma-separated):**
```env
CORS_ORIGIN=https://app.bizflow.in,https://staging.bizflow.in
```

> ⚠️ In production, `CORS_ORIGIN` **must** be set or the server refuses to start (by design).

### Razorpay Payments

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `RAZORPAY_KEY` | `rzp_test_xxxx` | For payments | Public key (safe in frontend) |
| `RAZORPAY_SECRET` | `rzp_test_secret_xxxx` | For payments | Private key (backend only) |

**Where to get it:**
1. Go to https://dashboard.razorpay.com
2. Settings → API Keys
3. Use **Test** keys for development, **Live** keys for production
4. Test keys start with `rzp_test_`, live with `rzp_live_`

> ⚠️ **Never put `RAZORPAY_SECRET` in frontend code.** It stays in `backend/.env` only.

**Current status:** Razorpay is **globally enabled** (feature flag in DB). Can be toggled via Developer Dashboard at `/developer`.

### Email (Nodemailer SMTP)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `EMAIL_HOST` | `smtp.gmail.com` | For emails | SMTP server |
| `EMAIL_PORT` | `587` | For emails | SMTP port (587 = STARTTLS) |
| `EMAIL_USER` | `you@gmail.com` | For emails | Your email address |
| `EMAIL_PASS` | `xxxx xxxx xxxx xxxx` | For emails | App password (NOT your main password) |
| `EMAIL_FROM_NAME` | `BizFlow India` | For emails | Sender display name |

**Gmail App Password setup:**
1. Go to your Google Account → Security
2. Enable 2-Factor Authentication (required)
3. Search for "App passwords"
4. Generate password for "Mail" → "Other device" → name it "BizFlow"
5. Copy the 16-character password → use as `EMAIL_PASS`

**Alternative — Zoho Mail:**
```env
EMAIL_HOST=smtp.zoho.in
EMAIL_PORT=587
EMAIL_USER=hello@bizflow.in
EMAIL_PASS=your_zoho_password
```

**Current status:** Email notifications exist in code but are only triggered by MSME overdue cron and manual invoice sends.

### WhatsApp (Twilio)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxx` | For WhatsApp | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxx` | For WhatsApp | From Twilio Console |
| `TWILIO_WHATSAPP_FROM` | `+14155238886` | For WhatsApp | Twilio sandbox number |

**Where to get it:**
1. Go to https://console.twilio.com
2. Dashboard → Account Info → Account SID + Auth Token
3. Messaging → Try WhatsApp → Sandbox number

**Current status:** WhatsApp is **globally disabled** (`whatsapp_globally_enabled = 'false'` in `system_settings`). Can be enabled via Developer Dashboard.

### Google Drive (File Storage)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `GOOGLE_DRIVE_FOLDER_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OC` | For Drive uploads | Root folder ID |

**Service Account setup:**
1. Go to https://console.cloud.google.com
2. Create a project (or use existing)
3. Enable **Google Drive API**
4. Create **Service Account** → download JSON key
5. Save as `backend/google-service-account.json` (gitignored)
6. Share your Drive folder with the service account email

**File structure in Drive:**
```
Root Folder (GOOGLE_DRIVE_FOLDER_ID)
└── Company_ID_Name/
    ├── Products/images/     ← Product images (public)
    └── buyer_ID_Name/
        └── Agreement/       ← Buyer agreements (private)
```

---

## Minimum `.env` for Local Dev

If you just want to run locally without payments/email/WhatsApp:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx.neon.tech/neondb?sslmode=require

JWT_SECRET=generate_64_char_hex_here
JWT_EXPIRE=30d

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Leave these blank — features degrade gracefully
RAZORPAY_KEY=
RAZORPAY_SECRET=
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM_NAME=BizFlow India
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
GOOGLE_DRIVE_FOLDER_ID=
```

---

## Security Checklist Before Production

- [ ] Rotate `JWT_SECRET` — generate a new 64-char hex
- [ ] Set `NODE_ENV=production`
- [ ] Switch Razorpay to **Live** keys (`rzp_live_...`)
- [ ] Set `CORS_ORIGIN` to your actual frontend domain only
- [ ] Rotate Google Service Account JSON
- [ ] Never commit `.env` (it's in `.gitignore` ✅)
- [ ] Never commit `google-service-account.json` (it's in `.gitignore` ✅)
