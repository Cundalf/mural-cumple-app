# Multi-stage build ultra optimizado para reducir el tamaño de la imagen
FROM node:22-alpine AS base

# Instalar dependencias necesarias para better-sqlite3
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Stage 1: Dependencias de desarrollo para el build
FROM base AS deps
RUN npm ci --only=development --prefer-offline --no-audit

# Stage 2: Build de la aplicación
FROM base AS builder

# IMPORTANTE: Definir ARGs para recibir variables de entorno en build time
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_RECAPTCHA_BYPASS
ARG NODE_ENV

# Convertir ARGs a ENVs para que estén disponibles durante el build
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_BYPASS=$NEXT_PUBLIC_RECAPTCHA_BYPASS
ENV NODE_ENV=$NODE_ENV

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir la aplicación con las variables disponibles
RUN npm run build

# Stage 3: Imagen de producción ultra ligera
FROM node:22-alpine AS runner

# Instalar solo las dependencias mínimas necesarias para better-sqlite3
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && apk add --no-cache libc6-compat \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción con optimizaciones
RUN npm ci --only=production --prefer-offline --no-audit --no-optional \
    && npm cache clean --force \
    && rm -rf /tmp/*

# Copiar archivos construidos desde el stage de builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Crear directorios necesarios con permisos correctos
RUN mkdir -p /app/db /app/uploads \
    && chown -R nextjs:nodejs /app/db /app/uploads \
    && chmod 755 /app/db /app/uploads

# Cambiar al usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno para runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["node", "server.js"]