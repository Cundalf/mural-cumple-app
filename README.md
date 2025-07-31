# Mural de Cumpleaños 🎉

Una aplicación web para celebrar momentos especiales con galería de fotos/videos y mural de mensajes en tiempo real.

## Características ✨

- **Galería de Recuerdos**: Subir fotos y videos
- **Mural de Mensajes**: Mensajes especiales con colores aleatorios  
- **Tiempo Real**: Actualizaciones automáticas
- **Modo Administrador**: Eliminar contenido (`?admin=true`)
- **Exportar PDF**: Generar PDF con mensajes

## Tecnologías 🛠️

- Next.js 15 + TypeScript
- SQLite + Server-Sent Events
- Tailwind CSS
- Docker para producción

## Instalación 🚀

```bash
git clone <url-del-repositorio>
cd mural-cumple-app
npm install
npm run dev
```

Abrir http://localhost:3000

## Variables de Entorno

Copia `env.example` como `.env.local` para desarrollo.

Para producción, copia `env.production.example` como `.env` y configura:

```bash
NODE_ENV=production
```

## Producción con Docker 🚀

```bash
cp env.production.example .env
# Editar .env con tu configuración
docker-compose up -d --build
```

## Personalización 🎨

- **Colores**: Editar array `colors` en `app/mural/page.tsx`
- **Límites de archivos**: Modificar `app/api/media/upload/route.ts`
- **Estilos**: Tailwind CSS en los componentes

## Solución de Problemas 🔧

### Problemas comunes:
- Variables de entorno no configuradas
- Archivos muy grandes (límite 100MB)
- Tipos de archivo no soportados 