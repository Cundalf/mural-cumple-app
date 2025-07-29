# Mural de Cumpleaños 🎉

Una aplicación web para celebrar momentos especiales con una galería de fotos/videos y un mural de mensajes que se actualiza en tiempo real.

## Características ✨

- **Galería de Recuerdos**: Los usuarios pueden subir fotos y videos que se comparten instantáneamente
- **Mural de Mensajes**: Espacio para escribir mensajes especiales con colores aleatorios
- **Tiempo Real**: Todas las actualizaciones se sincronizan automáticamente entre usuarios
- **Modo Administrador**: Funciones para eliminar contenido inapropiado
- **Exportar PDF**: Genera un PDF bonito con todos los mensajes del mural
- **Base de Datos SQLite**: Almacenamiento persistente y confiable
- **Diseño Responsivo**: Funciona perfectamente en móviles y escritorio

## Tecnologías 🛠️

- **Next.js 15** - Framework de React
- **TypeScript** - Tipado estático
- **SQLite** (better-sqlite3) - Base de datos
- **Server-Sent Events** - Actualizaciones en tiempo real
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes de interfaz

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

3. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   ```

4. **Abrir en el navegador**
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

## Configuración de Producción 🏗️

1. **Variables de entorno** (opcional)
   ```bash
   # No requiere configuración adicional por defecto
   ```

2. **Build para producción**
   ```bash
   pnpm build
   pnpm start
   ```

3. **Despliegue**
   - La aplicación incluye todo lo necesario
   - La base de datos SQLite se crea automáticamente
   - El directorio `uploads/` se genera automáticamente

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

### La base de datos no se crea
- Asegúrate de que el proceso tenga permisos de escritura
- Verifica que no hay procesos bloqueando el archivo

### Los archivos no se suben
- Verifica que el directorio `uploads/` existe
- Comprueba los permisos del directorio
- Revisa la consola del navegador para errores

### Las actualizaciones en tiempo real no funcionan
- Verifica que el servidor esté ejecutándose
- Comprueba la conexión SSE en las herramientas de desarrollador
- Asegúrate de que no hay proxies bloqueando conexiones persistentes

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