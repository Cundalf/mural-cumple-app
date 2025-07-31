# Mural de Cumpleaños 🎉

Una aplicación web para celebrar momentos especiales con galería de fotos/videos y mural de mensajes en tiempo real.

## Características ✨

- **Galería de Recuerdos**: Subir fotos y videos
- **Mural de Mensajes**: Mensajes especiales con colores aleatorios  
- **Tiempo Real**: Actualizaciones automáticas
- **Modo Administrador**: Eliminar contenido (`?admin=true`)
- **Exportar PDF**: Generar PDF con mensajes
- **Protección reCAPTCHA**: Google reCAPTCHA v3 para prevenir bots

## Tecnologías 🛠️

- Next.js 15 + TypeScript
- SQLite + Server-Sent Events
- Tailwind CSS
- Google reCAPTCHA v3
- Docker para producción

## Instalación 🚀

```bash
git clone <url-del-repositorio>
cd mural-cumple-app
npm install
npm run dev
```

Abrir http://localhost:3000

## Configuración de reCAPTCHA 🔒

### 1. Obtener Claves
1. Ve a [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Crea un nuevo sitio con **reCAPTCHA v3**
3. Agrega tu dominio (ej: `localhost` para desarrollo)
4. Copia las claves generadas

### 2. Configurar Variables de Entorno

Copia `env.example` como `.env.local` y configura:

```env
# Google reCAPTCHA v3
RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui
RECAPTCHA_SECRET_KEY=tu_clave_secreta_aqui
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui

# Bypass de reCAPTCHA (SOLO para desarrollo/emergencias)
# ⚠️ ADVERTENCIA: Solo usar en desarrollo o situaciones de emergencia
# ⚠️ NUNCA usar en producción
RECAPTCHA_BYPASS=false
NEXT_PUBLIC_RECAPTCHA_BYPASS=false
```

### 3. Bypass de Emergencia

Para deshabilitar temporalmente reCAPTCHA en desarrollo:

```env
RECAPTCHA_BYPASS=true
NEXT_PUBLIC_RECAPTCHA_BYPASS=true
```

**⚠️ ADVERTENCIA**: Solo usar en desarrollo. NUNCA en producción.

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
- **Umbrales reCAPTCHA**: Modificar `threshold` en los endpoints

## Documentación 📚

- **reCAPTCHA**: Ver `docs/RECAPTCHA_SETUP.md` para configuración detallada
- **Claves Reales**: Ver `docs/RECAPTCHA_KEYS_SETUP.md` para obtener claves

## Solución de Problemas 🔧

### Problemas comunes:
- Variables de entorno no configuradas
- Archivos muy grandes (límite 100MB)
- Tipos de archivo no soportados
- reCAPTCHA no cargado (verificar CSP y claves)
- Scores bajos de reCAPTCHA (ajustar umbrales) 