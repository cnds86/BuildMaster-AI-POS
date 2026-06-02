# ============================================================
# MHX-POS Backend Dockerfile
# Bun runtime, Alpine, production
# ============================================================

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install only prod dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy application code
COPY server/ ./server/
COPY dist/ ./dist/
COPY package.json .

# Environment file (contains DB_HOST, DB_PASSWORD, JWT_SECRET, etc.)
# The --env-file flag loads these into the process environment at startup.
# Ensure .env is present at build context root (not checked into git).
RUN cp .env.example .env 2>/dev/null || true

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health || exit 1

# --env-file=.env loads DB_HOST, JWT_SECRET, etc. from /app/.env at runtime
CMD ["bun", "--env-file=.env", "run", "server/index.ts"]
