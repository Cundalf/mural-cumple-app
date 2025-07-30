# Usar una imagen base de Node.js
FROM node:22-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar todo el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Crear directorios necesarios
RUN mkdir -p /app/db /app/uploads

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Comando de inicio
CMD ["npm", "start"] 