# syntax=docker/dockerfile:1

# ===== Stage 1: сборка SPA =====
FROM node:22-alpine AS build
WORKDIR /app

# Зависимости отдельным слоем — кешируется, пока не изменился lock-файл.
COPY package.json package-lock.json ./
RUN npm ci

# Исходники и сборка. base='/' — раздаём из корня; домен и SSL живут на внешнем
# reverse-proxy, внутренний образ о них ничего не знает.
COPY . .
ARG BASE_PATH=/
# Потолок кучи Node: в memory-ограниченных контейнерах V8 авто-занижает old-space
# (~0.5GB) и vite падает с OOM на рендере тяжёлых чанков. Это ceiling, а не резерв.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN BASE_PATH=${BASE_PATH} npm run build

# ===== Stage 2: раздача статики через nginx =====
FROM nginx:1.27-alpine AS runtime

# Своя конфигурация: SPA-fallback, кеш, gzip; без server_name-домена и SSL.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Только собранная статика (node_modules и тулчейн остаются в build-стейдже).
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Лёгкий healthcheck (busybox wget есть в alpine).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# nginx:alpine уже задаёт корректный CMD (nginx в foreground).
