# Usar una imagen base de Node.js
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo dev) para el build
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Establecer variables de entorno para el build (deben estar disponibles durante npm run build)
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_DISABLE_TURNSTILE
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_DISABLE_TURNSTILE=$NEXT_PUBLIC_DISABLE_TURNSTILE

# Construir la aplicación
RUN npm run build

# Limpiar devDependencies después del build para reducir tamaño
RUN npm ci --only=production && npm cache clean --force

# Crear directorios necesarios
RUN mkdir -p /app/db /app/uploads

# Exponer puerto
EXPOSE 3000

# Variables de entorno para runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Comando de inicio
CMD ["npm", "start"] 