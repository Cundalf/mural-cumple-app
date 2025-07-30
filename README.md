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

## Solución de Problemas 🔧

### Cloudflare Turnstile no se renderiza en producción

Si tienes problemas con Turnstile en producción:

1. **Ejecuta el diagnóstico:**
   ```bash
   npm run check-turnstile
   ```

2. **Verifica las variables de entorno:**
   ```bash
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key
   CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key
   NEXT_PUBLIC_DISABLE_TURNSTILE=false
   ```

3. **Habilita el modo debug:**
   ```bash
   NEXT_PUBLIC_SHOW_TURNSTILE_DEBUG=true
   ```

4. **Consulta la guía completa:** [TURNSTILE_TROUBLESHOOTING.md](./TURNSTILE_TROUBLESHOOTING.md)

### Problemas comunes:
- Variables de entorno no configuradas
- Dominio no autorizado en Cloudflare
- Bloqueadores de anuncios
- Claves inválidas o expiradas 