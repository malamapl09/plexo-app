# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package file
COPY apps/web/package.json ./

# Install dependencies
RUN npm install

# Copy source
COPY apps/web/ .

# Ensure public directory exists
RUN mkdir -p public

# Build args for Next.js static build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_LOGO

# Build with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-old-space-size=256", "server.js"]
