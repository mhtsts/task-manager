# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependency manifest
COPY package.json package-lock.json* ./
# Reproducible dependencies
RUN npm cache clean --force \
  && npm ci --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

# TypeScript source
COPY tsconfig.json .
COPY src ./src

# Compile application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy compiled application
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Runtime dependencies only
RUN npm cache clean --force \
  && npm install --only=production --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=8080

# Container health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Container port
EXPOSE 8080

# Start service
CMD ["node", "dist/index.js"]