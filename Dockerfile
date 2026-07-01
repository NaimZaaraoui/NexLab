
# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Force apt-get to use IPv4 and disable date/validity checks to avoid mirror synchronization issues
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Valid-Until "false";' >> /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Date "false";' >> /etc/apt/apt.conf.d/99apt-tricks

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    gcc \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY app/generated/prisma ./prisma
# Configure npm for better network resilience
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install dependencies (including devDependencies for build) with cache
RUN --mount=type=cache,target=/root/.npm npm ci

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Force apt-get to use IPv4 and disable date/validity checks to avoid mirror synchronization issues
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Valid-Until "false";' >> /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Date "false";' >> /etc/apt/apt.conf.d/99apt-tricks

# Install OpenSSL in builder stage for prisma generate
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy DATABASE_URL for prisma generate (validation only)
ENV DATABASE_URL="file:./dev.db"

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED="1"
RUN npm run build

# Prune devDependencies to keep image small
RUN npm prune --production

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

# Force apt-get to use IPv4 and disable date/validity checks to avoid mirror synchronization issues
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Valid-Until "false";' >> /etc/apt/apt.conf.d/99apt-tricks && \
    echo 'Acquire::Check-Date "false";' >> /etc/apt/apt.conf.d/99apt-tricks

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"

# Install OpenSSL, CA certificates, curl and build tools for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    build-essential \
    python3 \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm1 \
    libnss3 \
    libpangocairo-1.0-0 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Set up data directory for SQLite persistence
RUN mkdir -p /app/data
RUN chown nextjs:nodejs /app/data

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Automatically reference the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy scripts and make entrypoint executable
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x ./scripts/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT="3000"
ENV CHROMIUM_PATH="/usr/bin/chromium"
ENV HOSTNAME="0.0.0.0"

# Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://0.0.0.0:3000/api/health/docker || exit 1

ENTRYPOINT ["./scripts/entrypoint.sh"]
