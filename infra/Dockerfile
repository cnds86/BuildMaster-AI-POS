FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

# Build frontend assets
RUN bun run build

# Production stage
FROM oven/bun:1.3.13-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/server ./server
COPY --from=base /app/package.json ./

EXPOSE 3000

CMD ["bun", "run", "server/index.ts"]
