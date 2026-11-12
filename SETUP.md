# BizFlow — New Machine Setup Guide
> Follow this top to bottom. Takes ~10 minutes on a fresh machine.
> Last Updated: November 2026

---

## Prerequisites

Install these first if not already present:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18+ (LTS) | https://nodejs.org |
| **Git** | Any recent | https://git-scm.com |
| **VS Code** (recommended) | Any | https://code.visualstudio.com |

Verify installs:
```powershell
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x or 10.x
git --version
```

> ⚠️ **No Docker required.** The database is Neon PostgreSQL (cloud) — nothing runs locally except Node.js and the React dev server.

---

## Step 1 — Clone the Repository

```powershell
git clone https://github.com/lovie1188/bizflow.git
cd bizflow
```

Checkout the active development branch:
```powershell
git checkout feature/b2b-platform-v1
```

Verify you're on the right branch:
```powershell
git branch
# Should show: * feature/b2b-platform-v1
```

---

## Step 2 — Backend Setup

### 2a. Install dependencies
```powershell
cd backend
npm install
```

### 2b. Create the `.env` file
```powershell
copy .env.example .env
```
Then open `backend/.env` and fill in the real values.

**Minimum required to run locally:**
```env
NODE_ENV=development
PORT=5000

# Get this from the Neon dashboard (https://console.neon.tech)
DATABASE_URL=postgresql://user:password@host/bizflow_db?sslmode=require

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_hex_string_here
JWT_EXPIRE=30d

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Leave these blank for now — features are disabled
RAZORPAY_KEY=
RAZORPAY_SECRET=
EMAIL_HOST=
EMAIL_USER=
EMAIL_PASS=
```

> See `Documents/env.md` for where to find each credential.

### 2c. Start the backend
```powershell
node src/server.js
```

**Wait for this output before proceeding:**
```
BizFlow API Server running on http://localhost:5000
Environment: development
Database initialized
Migrations applied
```

> ⚠️ Neon PostgreSQL is serverless — the first request may take 10–15 seconds (cold start). This is normal in development.

---

## Step 3 — Frontend Setup

Open a **new terminal window**:

```powershell
cd bizflow/frontend
npm install
npm start
```

The browser should auto-open at `http://localhost:3000`.

If it doesn't, open manually: **http://localhost:3000**

---

## Step 4 — Verify Everything Works

Open these URLs in order:

| URL | Expected Result |
|-----|----------------|
| `http://localhost:3000/` | BizFlow platform landing page |
| `http://localhost:3000/login` | Login form with "BizFlow" branding |
| `http://localhost:3000/store/charumar` | Charu Marketing store with products |
| `http://localhost:3000/marketplace` | Aggregated product catalog |

Login and test:
```
Admin:  admin@bizflow.com   / password123  → goes to /admin
Buyer:  buyer1@acmecorp.com / password123  → goes to /shop
Dev:    dev@bizflow.in      / password123  → goes to /developer
```

---

## Step 5 — VS Code Setup (Recommended)

Install these extensions for the best experience:

```
ES7+ React/Redux/React-Native snippets
ESLint
Prettier
GitLens
```

Recommended workspace settings — create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "files.eol": "\n"
}
```

---

## Daily Development Workflow

### Starting up each day
```powershell
# Terminal 1 — Backend
cd D:\path\to\bizflow\backend
node src/server.js

# Terminal 2 — Frontend
cd D:\path\to\bizflow\frontend
npm start
```

### Before starting work
```powershell
cd bizflow
git pull origin feature/b2b-platform-v1
```

### Creating a new feature
```powershell
git checkout -b feature/your-feature-name
# ... make changes ...
# Test thoroughly → confirm with team → then:
git add -A
git commit -m "feat: description"
git push -u origin feature/your-feature-name
```

> ⚠️ **Never push directly to `master`.** Always work on a feature branch.

---

## Troubleshooting

### Backend won't start
```
Error: connect ECONNREFUSED
```
→ Check your `DATABASE_URL` in `backend/.env` is correct and Neon is reachable.

### Frontend shows blank page
→ Check browser console (F12). Usually a missing `.env` or backend not running.

### API calls fail (CORS error)
→ Make sure `CORS_ORIGIN=http://localhost:3000` is set in `backend/.env`.

### Neon takes too long (timeout)
→ Normal — serverless cold start. Wait 15 seconds and retry. If consistent, check DATABASE_URL.

### Port already in use
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Project Structure Quick Reference

```
bizflow/
├── backend/              ← Node.js + Express API (port 5000)
│   ├── src/server.js     ← Entry point
│   ├── src/routes/       ← All API routes
│   ├── .env              ← ⚠️ Your credentials (never commit)
│   └── .env.example      ← Template
│
├── frontend/             ← React app (port 3000)
│   ├── src/App.jsx       ← All routes
│   ├── src/index.css     ← Design tokens (CSS variables)
│   └── src/pages/        ← All pages
│
└── Documents/            ← All project documentation
    ├── PRD.md            ← What we're building
    ├── architecture.md   ← How it's built
    ├── design.md         ← Design system
    ├── rules.md          ← Dev rules
    ├── task.md           ← Task board & test checklist
    ├── memory.md         ← Decisions & change history
    ├── api.md            ← Full API reference
    └── env.md            ← Where to get each credential
```
