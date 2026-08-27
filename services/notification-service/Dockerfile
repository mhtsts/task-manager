FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm cache clean --force \
  && npm ci --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

COPY tsconfig.json .
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN npm cache clean --force \
  && npm install --only=production --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

ENV NODE_ENV=production
ENV PORT=8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

EXPOSE 8081

CMD ["node", "dist/index.js"]