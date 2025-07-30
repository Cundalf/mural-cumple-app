# Mural de Cumpleaños 🎉

Una aplicación web para celebrar momentos especiales con galería de fotos/videos y mural de mensajes en tiempo real.

## Características ✨

- **Galería de Recuerdos**: Subir fotos y videos
- **Mural de Mensajes**: Mensajes especiales con colores aleatorios  
- **Tiempo Real**: Actualizaciones automáticas
- **Protección Anti-Bots**: Cloudflare Turnstile
- **Modo Administrador**: Eliminar contenido (`?admin=true`)
- **Exportar PDF**: Generar PDF con mensajes

## Tecnologías 🛠️

- Next.js 15 + TypeScript
- SQLite + Server-Sent Events
- Cloudflare Turnstile + Tailwind CSS
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

Copia `env.example` como `.env.local` para desarrollo:

```bash
# Opcional: Deshabilitar Turnstile para desarrollo más rápido
NEXT_PUBLIC_DISABLE_TURNSTILE=true
```

Para producción, copia `env.production.example` como `.env` y configura:

```bash
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key
NODE_ENV=production
```

## Producción con Docker 🚀

```bash
cp env.production.example .env
# Editar .env con tus claves
docker-compose up -d --build
```

## Personalización 🎨

- **Colores**: Editar array `colors` en `app/mural/page.tsx`
- **Límites de archivos**: Modificar `app/api/media/upload/route.ts`
- **Estilos**: Tailwind CSS en los componentes 