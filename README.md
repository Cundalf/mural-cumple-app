# Mural de Cumpleaños 🎉

Una aplicación web para celebrar momentos especiales con una galería de fotos/videos y un mural de mensajes que se actualiza en tiempo real.

## Características ✨

- **Galería de Recuerdos**: Subir fotos y videos que se comparten instantáneamente
- **Mural de Mensajes**: Escribir mensajes especiales con colores aleatorios
- **Tiempo Real**: Actualizaciones automáticas entre usuarios
- **Protección Anti-Bots**: Cloudflare Turnstile integrado
- **Modo Administrador**: Eliminar contenido inapropiado
- **Exportar PDF**: Generar PDF con todos los mensajes
- **Base de Datos SQLite**: Almacenamiento persistente
- **Diseño Responsivo**: Funciona en móviles y escritorio

## Tecnologías 🛠️

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **SQLite** - Base de datos
- **Server-Sent Events** - Tiempo real
- **Cloudflare Turnstile** - Protección anti-bots
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes
- **Docker** - Contenedores para producción

## Instalación 🚀

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd mural-cumple-app
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno** (opcional)
   ```bash
   # Crear .env.local para desarrollo
   cp env.example .env.local
   # Editar según necesites
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## Estructura del Proyecto 📁

```
mural-cumple-app/
├── app/                    # Páginas de Next.js
│   ├── api/               # Endpoints de API
│   │   ├── events/        # Server-Sent Events
│   │   ├── media/         # Gestión de archivos
│   │   └── messages/      # Gestión de mensajes
│   ├── galeria/           # Página de galería
│   └── mural/             # Página de mural
├── lib/                   # Utilidades y configuración
│   ├── database.ts        # Configuración de SQLite
│   └── events.ts          # Sistema de eventos
├── hooks/                 # Hooks de React
│   └── use-realtime.ts    # Hook para tiempo real
├── uploads/               # Archivos multimedia
└── database.sqlite        # Base de datos SQLite
```

## Uso 📖

### Navegación Principal
La página principal (`/`) muestra dos opciones:
- **Galería de Recuerdos**: Ver y subir fotos/videos
- **Mural de Mensajes**: Escribir y leer mensajes

### Galería de Recuerdos (`/galeria`)
- Subir múltiples fotos y videos simultáneamente
- Ver contenido en una grilla responsiva
- Hacer clic para ver en tamaño completo
- Actualizaciones automáticas cuando otros suben contenido

### Mural de Mensajes (`/mural`)
- Escribir mensajes con nombre y texto
- Colores aleatorios para cada mensaje
- Exportar todos los mensajes como PDF
- Actualizaciones automáticas de mensajes nuevos

### Modo Administrador
Agregar `?admin=true` a cualquier URL para activar funciones de administración:
- `http://localhost:3000/galeria?admin=true`
- `http://localhost:3000/mural?admin=true`

En modo admin puedes:
- Eliminar fotos/videos inapropiados
- Eliminar mensajes ofensivos

## API Endpoints 🔌

### Mensajes
- `GET /api/messages` - Obtener todos los mensajes
- `POST /api/messages` - Crear nuevo mensaje
- `DELETE /api/messages?id=<id>` - Eliminar mensaje

### Archivos Multimedia
- `GET /api/media` - Obtener lista de archivos
- `POST /api/media/upload` - Subir archivos
- `DELETE /api/media?id=<id>` - Eliminar archivo
- `GET /api/media/serve/<id>` - Servir archivo

### Eventos en Tiempo Real
- `GET /api/events` - Stream de Server-Sent Events

## Variables de Entorno 🔧

### Desarrollo (opcional)
```bash
# Deshabilitar Turnstile para desarrollo más rápido
NEXT_PUBLIC_DISABLE_TURNSTILE=true
DISABLE_TURNSTILE=true
```

### Producción (recomendado)
```bash
# Cloudflare Turnstile para protección anti-bots
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_secret_key

# Configuración de la aplicación
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**Nota:** Para producción, copia `env.production.example` como `.env` y configura tus valores reales.

## Despliegue 🚀

### Desarrollo Local

```bash
pnpm build
pnpm start
```

### Producción con Docker

1. **Configurar variables de entorno:**
   ```bash
   cp env.production.example .env
   # Editar .env con tus claves de Cloudflare Turnstile
   ```

2. **Construir y ejecutar:**
   ```bash
   docker-compose up -d --build
   ```

3. **Verificar:**
   ```bash
   curl http://localhost:3000/api/health
   ```

### Configuración de Caddy (Recomendada)

Si usas Caddy como proxy reverso, agrega esta configuración a tu `Caddyfile`:

```caddy
tu-dominio.com {
    reverse_proxy mural-cumple-app:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up Host {host}
    }
    
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }
    
    encode gzip
}
```

**Nota:** Asegúrate de que el contenedor de Caddy esté en la misma red `caddy_network` que la aplicación.

### Características de Producción

- ✅ Multi-stage Docker build optimizado
- ✅ Health checks automáticos
- ✅ Persistencia de datos con volúmenes
- ✅ Variables de entorno seguras
- ✅ Usuario no-root en contenedor
- ✅ Integración con Caddy como proxy reverso

## Personalización 🎨

### Colores de Mensajes
Edita el array `colors` en `app/mural/page.tsx` para cambiar los colores disponibles.

### Límites de Archivos
Modifica las configuraciones en `app/api/media/upload/route.ts` para cambiar:
- Tamaños máximos de archivo
- Tipos de archivo permitidos
- Cantidad máxima de archivos

### Estilos
La aplicación usa Tailwind CSS. Modifica las clases en los componentes para personalizar la apariencia.

## Solución de Problemas 🔧

### Base de datos no se crea
- Verificar permisos de escritura
- Comprobar que no hay procesos bloqueando el archivo

### Archivos no se suben
- Verificar que existe el directorio `uploads/`
- Comprobar permisos del directorio
- Revisar consola del navegador

### Tiempo real no funciona
- Verificar que el servidor esté ejecutándose
- Comprobar conexión SSE en herramientas de desarrollador
- Asegurar que no hay proxies bloqueando conexiones

## Contribuir 🤝

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia 📄

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para detalles.

---

¡Hecho con 💕 para celebrar momentos especiales! 