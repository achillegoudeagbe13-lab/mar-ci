# ════════════════════════════════════════════════════════════════════════════
#  MAR-CI — Dockerfile (service unique : API Express + PWA Expo + Mobile OTA)
#
#  Build multi-stage :
#    stage 1 (builder) — compile tout, puis jette les sources et node_modules
#    stage 2 (runtime) — image minimale, uniquement les artefacts nécessaires
#
#  Variables attendues AU BUILD (--build-arg sur Render) :
#    EXPO_PUBLIC_DOMAIN   → ex : mar-ci.onrender.com       (sans https://)
#    EXPO_PUBLIC_API_URL  → ex : https://mar-ci.onrender.com
#
#  Variables attendues AU RUNTIME (Environment sur Render) :
#    DATABASE_URL         → URL Neon / Supabase PostgreSQL
#    SESSION_SECRET       → secret de session
#    PORT                 → injecté automatiquement par Render (défaut : 10000)
# ════════════════════════════════════════════════════════════════════════════

# ── Stage 1 : Builder ────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Build-time args — seront gravés dans les bundles Expo au moment du build
ARG EXPO_PUBLIC_DOMAIN
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_DOMAIN=${EXPO_PUBLIC_DOMAIN}
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm@10 --quiet

# Copier les fichiers de configuration workspace (optimise le cache Docker)
COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Vérifier si pnpm-lock.yaml existe et le copier
COPY pnpm-lock.yaml* ./

# Copier les sources
COPY lib/       ./lib/
COPY artifacts/ ./artifacts/
COPY scripts/   ./scripts/

# Installer toutes les dépendances
RUN pnpm install --frozen-lockfile

# 1. Compiler les libs TypeScript partagées (drizzle schema, etc.)
RUN pnpm run typecheck:libs

# 2. Builder le PWA Expo (web uniquement — mobile ignoré sur Render/Docker)
#    → artifacts/mar-ci-compta/static-build/web/
RUN SKIP_MOBILE_BUILD=true node artifacts/mar-ci-compta/scripts/build.js

# 3. Compiler l'API Express avec esbuild
#    → artifacts/api-server/dist/index.mjs  (bundle autonome, sans node_modules)
RUN pnpm --filter @workspace/api-server run build


# ── Stage 2 : Runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

# Uniquement les artefacts compilés — pas de sources, pas de node_modules
COPY --from=builder /app/artifacts/api-server/dist/          ./artifacts/api-server/dist/
COPY --from=builder /app/artifacts/mar-ci-compta/static-build/ ./artifacts/mar-ci-compta/static-build/

# Variables d'environnement runtime
ENV NODE_ENV=production
ENV STATIC_ROOT=artifacts/mar-ci-compta/static-build
ENV PORT=10000

EXPOSE 10000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
