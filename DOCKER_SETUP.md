# Configuración de Docker con Cloudflare Turnstile

## Problema común: Turnstile no aparece en Docker

Si Cloudflare Turnstile no aparece cuando haces build de Docker, es probablemente porque las variables de entorno `NEXT_PUBLIC_*` no están disponibles durante el tiempo de build.

## Solución

### 1. Configurar variables de entorno

Crea un archivo `.env` en el directorio raíz del proyecto:

```bash
# Cloudflare Turnstile (requerido para producción)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key_aqui
CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key_aqui

# Deshabilitar Turnstile (opcional, para desarrollo)
# NEXT_PUBLIC_DISABLE_TURNSTILE=true
# DISABLE_TURNSTILE=true
```

### 2. Verificar configuración

Antes de hacer build, verifica que las variables estén configuradas:

```bash
npm run check-turnstile
```

### 3. Build y ejecución con Docker

```bash
# Reconstruir la imagen con las variables de entorno
docker-compose up --build

# O si prefieres usar docker build directamente:
docker build \
  --build-arg NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key_aqui \
  --build-arg NEXT_PUBLIC_DISABLE_TURNSTILE=false \
  -t mural-cumple-app .
```

### 4. Verificar que funciona

1. Abre la aplicación en tu navegador
2. Ve a la página del mural o galería
3. Deberías ver el widget de Turnstile

## Troubleshooting

### Turnstile no aparece

1. **Verifica las variables de entorno:**
   ```bash
   npm run check-turnstile
   ```

2. **Revisa los logs de Docker:**
   ```bash
   docker-compose logs mural-cumple-app
   ```

3. **Verifica que el script se cargue:**
   - Abre las herramientas de desarrollador del navegador
   - Ve a la pestaña Network
   - Busca si se cargó `turnstile/v0/api.js`

### Error de "site key not found"

1. Asegúrate de que `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` esté configurada
2. Verifica que la clave sea válida en tu panel de Cloudflare
3. Asegúrate de que el dominio esté autorizado en Cloudflare

### Para desarrollo/testing

Si quieres deshabilitar Turnstile temporalmente:

```bash
# En tu .env
NEXT_PUBLIC_DISABLE_TURNSTILE=true
DISABLE_TURNSTILE=true
```

## Estructura de archivos importante

```
mural-cumple-app/
├── .env                    # Variables de entorno (crear)
├── docker-compose.yml      # Configuración de Docker
├── Dockerfile             # Build de la imagen
├── next.config.mjs        # Configuración de Next.js
└── scripts/
    └── check-turnstile.js # Script de verificación
```

## Variables de entorno explicadas

- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`: Clave pública que se usa en el frontend
- `CLOUDFLARE_TURNSTILE_SECRET_KEY`: Clave secreta que se usa en el backend
- `NEXT_PUBLIC_DISABLE_TURNSTILE`: Deshabilita Turnstile en el frontend
- `DISABLE_TURNSTILE`: Deshabilita la verificación en el backend

## Notas importantes

1. Las variables `NEXT_PUBLIC_*` deben estar disponibles durante el build
2. El archivo `.env` debe estar en el directorio raíz
3. Para producción, considera usar variables de entorno del sistema o secrets
4. El script de Turnstile se carga condicionalmente solo si no está deshabilitado 