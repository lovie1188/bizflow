# ── BizFlow Frontend Dockerfile ───────────────────────────────────────────
# Multi-stage build:
#   Stage 1 — Build the React app (npm run build)
#   Stage 2 — Serve the static output with Nginx (tiny, fast production image)

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for caching
COPY package.json ./

# Install ALL deps (devDeps needed for react-scripts build)
RUN npm install

# Copy source
COPY public/ ./public/
COPY src/ ./src/

# Build args — injected at build time by docker-compose / CI
# These become REACT_APP_* env vars baked into the JS bundle
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the optimised production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy our build output
COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config — handles React Router (SPA) fallback correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
