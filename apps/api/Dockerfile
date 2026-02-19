# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy database package (Prisma schema + client)
COPY packages/database/package.json packages/database/
COPY packages/database/ packages/database/

# Copy API package file
COPY apps/api/package.json apps/api/

# Install database dependencies + generate Prisma Client
WORKDIR /app/packages/database
RUN npm install

RUN npx prisma generate

# Install API dependencies
WORKDIR /app/apps/api
RUN npm install

# Copy API source
COPY apps/api/ .

# Build NestJS
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
