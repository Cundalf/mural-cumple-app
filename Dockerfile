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