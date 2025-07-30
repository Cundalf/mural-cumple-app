# Solución de Problemas: Cloudflare Turnstile en Producción

## 🚨 Problema: Turnstile no se renderiza en producción

### Diagnóstico Rápido

1. **Ejecuta el script de verificación:**
   ```bash
   npm run check-turnstile
   ```

2. **Verifica las variables de entorno:**
   ```bash
   # Debe estar configurado en producción
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key_aqui
   CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key_aqui
   
   # NO debe estar en true en producción
   NEXT_PUBLIC_DISABLE_TURNSTILE=false
   DISABLE_TURNSTILE=false
   ```

### 🔍 Verificación en el Navegador

1. **Abre las herramientas de desarrollador (F12)**
2. **Ve a la pestaña Console** y busca:
   - `✅ Turnstile script cargado exitosamente`
   - `📡 Evento turnstileLoaded recibido`
   - Errores relacionados con "turnstile" o "cloudflare"

3. **Ve a la pestaña Network** y verifica:
   - `https://challenges.cloudflare.com/turnstile/v0/api.js` se carga correctamente
   - No hay errores 403, 404 o de red

### 🛠️ Soluciones Comunes

#### 1. Variables de Entorno No Configuradas

**Síntoma:** Turnstile no aparece o muestra "Site key no configurada"

**Solución:**
```bash
# En tu archivo .env de producción
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAAADnV98YtNZqXXXXX
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAAADnV98YtNZqXXXXX
NEXT_PUBLIC_DISABLE_TURNSTILE=false
DISABLE_TURNSTILE=false
```

#### 2. Dominio No Autorizado en Cloudflare

**Síntoma:** Script se carga pero el widget no aparece

**Solución:**
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navega a **Security** > **Turnstile**
3. Edita tu sitio
4. En **Domains**, agrega tu dominio de producción
5. Ejemplo: `tudominio.com`, `www.tudominio.com`

#### 3. Claves Inválidas o Expiradas

**Síntoma:** Error "Clave de sitio inválida" o "Token de verificación inválido"

**Solución:**
1. Regenera las claves en Cloudflare Dashboard
2. Actualiza las variables de entorno
3. Reinicia la aplicación

#### 4. Bloqueadores de Anuncios

**Síntoma:** Turnstile no se carga en algunos navegadores

**Solución:**
- Desactiva temporalmente bloqueadores de anuncios
- Agrega `challenges.cloudflare.com` a la lista blanca
- Verifica que no haya extensiones bloqueando scripts

#### 5. Problemas de CSP (Content Security Policy)

**Síntoma:** Script bloqueado por políticas de seguridad

**Solución:**
El `next.config.mjs` ya incluye la configuración correcta:
```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;",
}
```

### 🔧 Herramientas de Diagnóstico

#### Componente de Debug

En desarrollo o con `NEXT_PUBLIC_SHOW_TURNSTILE_DEBUG=true`:
- Se muestra un panel de diagnóstico
- Verifica script, API, site key, red y dominio
- Muestra errores específicos

#### Script de Verificación

```bash
npm run check-turnstile
```

Verifica:
- Variables de entorno
- Archivos de configuración
- Dependencias
- Entorno de ejecución

### 🐳 Docker y Producción

#### Verificación en Docker

```bash
# Construir y ejecutar
docker-compose up --build

# Verificar logs
docker-compose logs -f

# Ejecutar script de verificación dentro del contenedor
docker-compose exec app npm run check-turnstile
```

#### Variables de Entorno en Docker

```bash
# En docker-compose.yml o .env
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key
NODE_ENV=production
```

### 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas
- [ ] Claves válidas en Cloudflare Dashboard
- [ ] Dominio autorizado en Cloudflare
- [ ] Script se carga sin errores
- [ ] No hay bloqueadores de anuncios
- [ ] CSP permite Cloudflare
- [ ] Aplicación reiniciada después de cambios

### 🆘 Si Nada Funciona

1. **Habilita el modo debug:**
   ```bash
   NEXT_PUBLIC_SHOW_TURNSTILE_DEBUG=true
   ```

2. **Verifica logs del servidor:**
   ```bash
   # En producción
   docker-compose logs -f app
   
   # En desarrollo
   npm run dev
   ```

3. **Contacta soporte:**
   - Incluye logs del navegador
   - Incluye resultado de `npm run check-turnstile`
   - Incluye capturas de pantalla del error

### 🔄 Reinicio Completo

Si todo falla, intenta un reinicio completo:

```bash
# 1. Detener aplicación
docker-compose down

# 2. Limpiar caché
docker system prune -f

# 3. Reconstruir
docker-compose up --build

# 4. Verificar
npm run check-turnstile
```

### 📞 Soporte

Si necesitas ayuda adicional:
1. Revisa los logs del navegador
2. Ejecuta el script de verificación
3. Verifica la configuración de Cloudflare
4. Contacta al equipo de desarrollo con toda la información recopilada 