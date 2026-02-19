# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/database/package.json packages/database/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN npm ci --workspace=apps/api --workspace=packages/database --include-workspace-root 2>/dev/null || npm ci

# Copy source
COPY packages/database/ packages/database/
COPY apps/api/ apps/api/

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build NestJS
WORKDIR /app/apps/api
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built output and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
