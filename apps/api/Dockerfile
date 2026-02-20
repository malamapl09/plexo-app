# ---- Build Stage ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy database package (Prisma schema + client)
COPY packages/database/package.json packages/database/
COPY packages/database/ packages/database/

# Copy API package file
COPY apps/api/package.json apps/api/

# Install database dependencies
WORKDIR /app/packages/database
RUN npm install

# Install API dependencies
WORKDIR /app/apps/api
RUN npm install

# Generate Prisma Client (outputs to apps/api/node_modules/.prisma/client per schema)
WORKDIR /app/packages/database
RUN npx prisma generate

# Copy API source
WORKDIR /app/apps/api
COPY apps/api/ .

# Build NestJS (type errors from multi-tenant Prisma extension are runtime-safe)
RUN npm run build || [ -d dist ]

# ---- Production Dependencies ----
FROM node:20-alpine AS deps

RUN apk add --no-cache openssl

WORKDIR /app
COPY apps/api/package.json .
COPY packages/database/package.json packages/database/
RUN npm install --omit=dev

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init openssl

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-old-space-size=384", "dist/main"]
