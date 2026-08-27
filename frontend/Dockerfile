FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE
COPY package.json package-lock.json ./
RUN npm cache clean --force \
	&& npm ci --legacy-peer-deps --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
