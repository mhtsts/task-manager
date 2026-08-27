# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
# Frontend API setting
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
# Dependency manifest
COPY package.json package-lock.json ./
# Reproducible dependencies
RUN npm cache clean --force \
	&& npm ci --legacy-peer-deps --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000
# Source and build
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
# Serve static files
COPY --from=builder /app/dist /usr/share/nginx/html
# Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Container port
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
