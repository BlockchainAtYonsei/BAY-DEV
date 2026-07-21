# --- Build ---
FROM node:22-alpine AS builder
# openssl은 Prisma용, python3/make/g++는 네이티브 모듈(utf-8-validate 등) 빌드용
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# 빌드 시점에는 실제 DB가 필요 없지만 PrismaClient 초기화를 위해 경로만 지정
ENV DATABASE_URL=file:/app/data/bay18.db
RUN npx prisma generate && npm run build
RUN npm prune --omit=dev

# --- Run ---
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/bay18.db

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

# 시작 시 스키마를 DB에 반영(없으면 생성)한 뒤 서버 기동
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx next start -p 3000"]
