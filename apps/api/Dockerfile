# cache-bust: 202605060022
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm ci --workspace=apps/api
RUN cd apps/api && npm install prisma@6 @prisma/client@6

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist         ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

RUN npm install --omit=dev
RUN npm install prisma@6 @prisma/client@6

COPY --from=builder /app/apps/api/prisma       ./prisma

# Genera el cliente Prisma en el runner
RUN npx prisma generate

# Crea directorios de uploads
RUN mkdir -p ./uploads/products ./uploads/temp && \
    chown -R nestjs:nodejs ./uploads && \
    chown -R nestjs:nodejs ./node_modules

USER nestjs

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
