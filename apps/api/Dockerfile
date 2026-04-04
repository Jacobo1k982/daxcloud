# ── Build stage ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api

COPY apps/api ./apps/api
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# ── Production stage ──────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist          ./dist
COPY --from=builder /app/apps/api/node_modules  ./node_modules
COPY --from=builder /app/apps/api/prisma        ./prisma
COPY --from=builder /app/apps/api/package.json  ./package.json

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]