# ── BizFlow Backend Dockerfile ────────────────────────────────────────────
# Multi-stage build for a lean production image.
# Database is on Neon (cloud) — no local DB service needed.

# ── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# ── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S bizflow && adduser -S bizflow -G bizflow

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src/ ./src/
COPY package.json ./

# Note: google-service-account.json is mounted as a read-only volume at runtime
# via docker-compose.yml — never bake secrets into the image.

# Set ownership to non-root user
RUN chown -R bizflow:bizflow /app

USER bizflow

# Expose backend port
EXPOSE 5000

# Health check — verifies the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/settings/public || exit 1

# Start the server
CMD ["node", "src/server.js"]
