# ==============================================================================
# Base — dependencias completas (incluye devDependencies)
# ==============================================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Dev — modo desarrollo (next dev). El código se monta como volumen en compose;
# esta etapa solo necesita node_modules completos (typescript, turbopack, etc.).
# ==============================================================================
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
# node_modules completos desde la etapa deps (poblan el volumen anónimo del compose)
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# start-period amplio: la primera compilación de next dev puede tardar.
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["npm", "run", "dev"]

# ==============================================================================
# Builder — compila la app para producción
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ==============================================================================
# Producción — solo dependencias de runtime + build compilado
# ==============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["npm", "run", "start"]
