#!/bin/bash
# Setup script para permisos correctos

echo "🔧 Configurando permisos para el proyecto..."

# Crear directorios si no existen
echo "📁 Creando directorios..."
mkdir -p ./data/uploads ./data/db

# Asignar ownership al usuario nextjs (UID 1001)
echo "👤 Asignando ownership..."
sudo chown -R 1001:1001 ./data/uploads ./data/db

# Permisos para uploads (lectura/escritura)
echo "🔓 Configurando permisos de uploads..."
sudo chmod -R 775 ./data/uploads

# Permisos para database (lectura/escritura)
echo "🗃️ Configurando permisos de database..."
sudo chmod -R 755 ./data/db

# Verificar permisos
echo "✅ Verificando permisos..."
ls -la ./data/

echo "🚀 Rebuilding contenedor..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "📊 Verificando contenedor..."
sleep 5
docker exec -it mural-cumple-app whoami
docker exec -it mural-cumple-app ls -la /app/

echo "✅ Setup completado!"