# Configuración de Cloudflare para Protección

## 1. Cloudflare Turnstile

### Obtener las Keys:
1. Ve a [Turnstile en Cloudflare](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Crea un nuevo sitio
3. Copia la **Site Key** y **Secret Key**

### Configurar en el proyecto:
1. Crea un archivo `.env.local` en la raíz del proyecto
2. Agrega las variables de entorno:
```env
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key_aqui
CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key_aqui
```

**Nota:** El prefijo `NEXT_PUBLIC_` es necesario para que la variable esté disponible en el cliente (frontend).

### Variables de Entorno:
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`: Se usa en el frontend (pública)
- `CLOUDFLARE_TURNSTILE_SECRET_KEY`: Se usa solo en el backend (privada)

**⚠️ Importante:** Nunca expongas la `SECRET_KEY` en el frontend, solo la `SITE_KEY`.

## 2. Configuración Adicional en Cloudflare

### Rate Limiting:
1. Ve a tu dashboard de Cloudflare
2. Navega a "Security" > "WAF" > "Rate Limiting"
3. Crea reglas para proteger tus endpoints:
   - `/api/messages` (POST)
   - `/api/events` (POST)
   - `/api/media/upload` (POST)

### Security Level:
1. En "Security" > "Settings"
2. Ajusta el Security Level según tus necesidades:
   - **Low**: Para desarrollo
   - **Medium**: Para producción normal
   - **High**: Para mayor protección
   - **I'm Under Attack**: Para ataques activos

### Bot Management:
1. En "Security" > "Bot Management"
2. Activa la protección automática
3. Configura reglas personalizadas si es necesario

## 3. Verificación

Una vez configurado:
- ✅ Turnstile aparecerá en el formulario del mural
- ✅ Los bots serán bloqueados automáticamente
- ✅ Los formularios estarán protegidos

## 4. Beneficios Obtenidos

- 🛡️ **Protección contra bots** automática
- 🚫 **Rate limiting** en endpoints sensibles
- 🔒 **Validación de formularios** con Turnstile
- 📈 **Métricas de seguridad** en Cloudflare 