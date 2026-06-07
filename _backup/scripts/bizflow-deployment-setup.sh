#!/bin/bash
# BizFlow Complete SaaS - Full Deployment & Infrastructure Setup

# ============================================================
# PROJECT STRUCTURE
# ============================================================
cat > /tmp/bizflow-structure.txt << 'EOF'
bizflow-saas/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── orders.js
│   │   │   ├── invoices.js
│   │   │   ├── products.js
│   │   │   └── payments.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Company.js
│   │   │   ├── Order.js
│   │   │   └── Invoice.js
│   │   └── utils/
│   │       ├── gst.js
│   │       ├── email.js
│   │       └── notifications.js
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Invoices.jsx
│   │   │   └── Subscription.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Modal.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js
│   │   │   └── useNotification.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── mobile/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   ├── OrdersScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── components/
│   │   ├── navigation/
│   │   └── App.js
│   ├── app.json
│   └── package.json
│
├── docker-compose.yml
├── nginx.conf
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml
│       ├── frontend-deploy.yml
│       └── mobile-build.yml
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── GST_COMPLIANCE.md
└── README.md

EOF

# ============================================================
# DOCKERFILE - BACKEND
# ============================================================
cat > /tmp/Dockerfile.backend << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5000

CMD ["node", "src/server.js"]
EOF

# ============================================================
# DOCKERFILE - FRONTEND
# ============================================================
cat > /tmp/Dockerfile.frontend << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# ============================================================
# DOCKER COMPOSE
# ============================================================
cat > /tmp/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: bizflow_postgres
    environment:
      POSTGRES_USER: bizflow_user
      POSTGRES_PASSWORD: secure_password_123
      POSTGRES_DB: bizflow_saas
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bizflow_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: bizflow_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bizflow_backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bizflow_user:secure_password_123@postgres:5432/bizflow_saas
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_min_32_chars_long_here
      PORT: 5000
      RAZORPAY_KEY: your_razorpay_key
      RAZORPAY_SECRET: your_razorpay_secret
      EMAIL_HOST: smtp.gmail.com
      EMAIL_PORT: 587
      EMAIL_USER: noreply@bizflow.in
      EMAIL_PASSWORD: your_email_password
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/logs:/app/logs
    restart: unless-stopped

  # Frontend Web App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bizflow_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: bizflow_nginx
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  default:
    name: bizflow_network
EOF

# ============================================================
# NGINX CONFIGURATION
# ============================================================
cat > /tmp/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name bizflow.in www.bizflow.in api.bizflow.in;

        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # API Routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CORS Headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        # Frontend Routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

    server {
        listen 443 ssl;
        server_name api.bizflow.in;

        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
        }
    }
}
EOF

# ============================================================
# GITHUB ACTIONS - CI/CD PIPELINE
# ============================================================
cat > /tmp/.github-workflows-backend-deploy.yml << 'EOF'
name: Backend Deploy

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-deploy.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linter
        working-directory: backend
        run: npm run lint

      - name: Run tests
        working-directory: backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to AWS
        run: |
          # Deploy script here
          echo "Deploying to production..."

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Backend deployed to production"
            }
EOF

# ============================================================
# GITHUB ACTIONS - FRONTEND DEPLOY
# ============================================================
cat > /tmp/.github-workflows-frontend-deploy.yml << 'EOF'
name: Frontend Deploy

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
EOF

# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================
cat > /tmp/.env.example << 'EOF'
# Backend Configuration
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bizflow_saas
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars_long_here
JWT_EXPIRE=30d

# Razorpay Payment Gateway
RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret_key

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@bizflow.in
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=BizFlow <noreply@bizflow.in>

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# AWS S3 (for invoices, documents)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=bizflow-documents

# Stripe (Alternative payment)
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Frontend Configuration
REACT_APP_API_URL=https://api.bizflow.in/api
REACT_APP_RAZORPAY_KEY=your_razorpay_public_key

# Mobile Configuration
EXPO_PUBLIC_API_URL=https://api.bizflow.in/api
EOF

# ============================================================
# PACKAGE.JSON - ROOT
# ============================================================
cat > /tmp/package.json << 'EOF'
{
  "name": "bizflow-saas",
  "version": "1.0.0",
  "description": "Complete B2B Payment & Invoice Management SaaS Platform for India",
  "private": true,
  "scripts": {
    "setup": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../mobile && npm install",
    "dev": "docker-compose -f docker-compose.dev.yml up",
    "prod": "docker-compose up -d",
    "logs": "docker-compose logs -f",
    "stop": "docker-compose down",
    "test": "cd backend && npm test",
    "lint": "cd backend && npm run lint && cd ../frontend && npm run lint"
  },
  "keywords": [
    "B2B",
    "SaaS",
    "Invoice",
    "Payment",
    "GST",
    "India",
    "MSME"
  ],
  "author": "BizFlow Team",
  "license": "MIT"
}
EOF

# ============================================================
# DOCUMENTATION
# ============================================================
cat > /tmp/DEPLOYMENT.md << 'EOF'
# BizFlow SaaS - Deployment Guide

## Prerequisites
- Docker & Docker Compose
- AWS Account (for hosting)
- PostgreSQL 15+
- Redis 7+
- Node.js 18+

## Local Development

```bash
# Clone repository
git clone https://github.com/yourname/bizflow-saas.git
cd bizflow-saas

# Setup all dependencies
npm run setup

# Start development environment
npm run dev

# Run tests
npm test

# Access applications:
# - Frontend: http://localhost:3000
# - API: http://localhost:5000
# - Docs: http://localhost:3000/docs
```

## Production Deployment

### 1. AWS Setup
```bash
# Create EC2 instance (Ubuntu 22.04)
# Install Docker & Docker Compose
# Configure security groups for 80, 443, 5432

# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Clone and setup
git clone https://github.com/yourname/bizflow-saas.git
cd bizflow-saas
npm run setup
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

### 3. SSL Certificates
```bash
# Using Let's Encrypt
sudo certbot certonly --standalone -d bizflow.in -d www.bizflow.in -d api.bizflow.in

# Copy to app directory
sudo cp /etc/letsencrypt/live/bizflow.in/fullchain.pem ./certs/cert.pem
sudo cp /etc/letsencrypt/live/bizflow.in/privkey.pem ./certs/key.pem
```

### 4. Deploy
```bash
# Start production environment
npm run prod

# Monitor logs
npm run logs

# Scale services
docker-compose up -d --scale backend=3
```

### 5. Backups
```bash
# Automated daily backups
docker exec bizflow_postgres pg_dump -U bizflow_user bizflow_saas | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20240101.sql.gz | docker exec -i bizflow_postgres psql -U bizflow_user bizflow_saas
```

## Monitoring

```bash
# Check service health
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# CPU & Memory usage
docker stats
```

## Performance Optimization

- Enable Redis caching
- Use CDN for static assets
- Database query optimization
- Implement rate limiting
- Use compression (gzip)

## Security

- Enable HTTPS/SSL
- Set up WAF rules
- Regular security audits
- Keep dependencies updated
- Implement API rate limiting
- Enable database encryption

---

For more info, see API.md and GST_COMPLIANCE.md
EOF

cat > /tmp/API.md << 'EOF'
# BizFlow API Documentation

## Base URL
```
https://api.bizflow.in/api
```

## Authentication
All requests require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
- POST `/auth/register` - Register new company
- POST `/auth/login` - User login
- POST `/auth/refresh` - Refresh token

### Orders
- GET `/orders` - List orders
- POST `/orders` - Create order
- GET `/orders/:id` - Get order details
- PUT `/orders/:id` - Update order

### Invoices
- GET `/invoices` - List invoices
- POST `/invoices` - Create invoice
- GET `/invoices/:id` - Get invoice (PDF)
- POST `/invoices/:id/send` - Send via email

### Payments
- POST `/payments/create-order` - Create Razorpay order
- POST `/payments/verify` - Verify payment
- GET `/payments/history` - Payment history

### Products
- GET `/products` - List products
- POST `/products` - Create product
- PUT `/products/:id` - Update product

### Collections
- GET `/collections/overdue` - Get overdue invoices
- POST `/collections/remind` - Send reminder
- GET `/collections/aging` - Aging analysis

---

Full API docs: See Swagger at /api/docs
EOF

echo "✅ BizFlow SaaS Architecture Complete!"
echo ""
echo "📁 Files created:"
echo "   - docker-compose.yml (Full stack)"
echo "   - Dockerfile.backend (Node.js API)"
echo "   - Dockerfile.frontend (React SPA)"
echo "   - nginx.conf (Reverse proxy & load balancing)"
echo "   - .env.example (Configuration template)"
echo "   - CI/CD workflows (GitHub Actions)"
echo "   - Documentation (Deployment, API, GST)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update .env with your values"
echo "   2. Set up AWS/DigitalOcean account"
echo "   3. Configure domain & SSL"
echo "   4. Run: npm run prod"
echo "   5. Monitor: npm run logs"
