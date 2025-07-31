# Configuración de Google reCAPTCHA v3

Esta aplicación utiliza Google reCAPTCHA v3 para proteger los endpoints sensibles contra bots y ataques automatizados.

## Endpoints Protegidos

Los siguientes endpoints requieren validación de reCAPTCHA:

- `POST /api/messages` - Crear mensajes
- `DELETE /api/messages` - Eliminar mensajes  
- `POST /api/media/upload` - Subir archivos multimedia
- `DELETE /api/media` - Eliminar archivos multimedia

## Configuración

### 1. Obtener Claves de reCAPTCHA

1. Ve a [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Crea un nuevo sitio
3. Selecciona **reCAPTCHA v3**
4. Agrega tu dominio (ej: `localhost` para desarrollo, `tudominio.com` para producción)
5. Copia las claves generadas

### 2. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local`:

```env
# Google reCAPTCHA v3
RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui
RECAPTCHA_SECRET_KEY=tu_clave_secreta_aqui
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui
```

**Nota:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` es necesaria para el frontend.

### 3. Configurar el Layout Principal

Actualiza tu `app/layout.tsx` para incluir el RecaptchaProvider:

```tsx
import { RecaptchaProvider } from '@/components/recaptcha-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <RecaptchaProvider>
          {children}
        </RecaptchaProvider>
      </body>
    </html>
  );
}
```

## Uso en el Frontend

### Hook Básico

```tsx
import { useRecaptchaRequest } from '@/components/recaptcha-provider';

function MessageForm() {
  const { makeRequest, isLoaded } = useRecaptchaRequest();

  const handleSubmit = async (data: any) => {
    try {
      const result = await makeRequest('/api/messages', {
        method: 'POST',
        action: 'create_message',
        body: data
      });
      console.log('Mensaje creado:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!isLoaded) {
    return <div>Cargando reCAPTCHA...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* tu formulario aquí */}
    </form>
  );
}
```

### Hook Personalizado

```tsx
import { useRecaptcha } from '@/components/recaptcha-provider';

function CustomForm() {
  const { execute, isLoaded } = useRecaptcha();

  const handleSubmit = async (data: any) => {
    try {
      const token = await execute('create_message');
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Recaptcha-Token': token
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error en la petición');
      }

      const result = await response.json();
      console.log('Éxito:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* tu formulario aquí */}
    </form>
  );
}
```

## Acciones de reCAPTCHA

Cada endpoint usa una acción específica para mejor análisis:

- `create_message` - Crear mensajes
- `delete_message` - Eliminar mensajes
- `upload_media` - Subir archivos multimedia
- `delete_media` - Eliminar archivos multimedia

## Configuración de Umbrales

El umbral por defecto es `0.5`. Puedes ajustarlo por endpoint:

```tsx
// Umbral más estricto para eliminaciones
const result = await makeRequest('/api/messages', {
  method: 'DELETE',
  action: 'delete_message',
  threshold: 0.7 // Solo permite usuarios con score >= 0.7
});
```

## Respuestas de Error

Cuando reCAPTCHA falla, recibirás respuestas como:

```json
{
  "error": "Actividad sospechosa detectada",
  "recaptcha_score": 0.3,
  "threshold": 0.5
}
```

## Debugging

### Headers de Respuesta

Los endpoints incluyen el score de reCAPTCHA en los headers:

```
X-Recaptcha-Score: 0.9
```

### Logs del Servidor

Revisa los logs del servidor para ver información de debug:

```bash
# Score bajo
reCAPTCHA score: 0.2 (threshold: 0.5)

# Score alto
reCAPTCHA score: 0.9 (threshold: 0.5)
```

## Consideraciones de Seguridad

1. **Nunca expongas la clave secreta** en el frontend
2. **Usa HTTPS** en producción
3. **Monitorea los scores** para ajustar umbrales
4. **Considera rate limiting** adicional si es necesario

## Troubleshooting

### Error: "reCAPTCHA no está cargado"
- Verifica que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` esté configurada
- Asegúrate de que el dominio esté registrado en Google reCAPTCHA

### Error: "Token de reCAPTCHA requerido"
- Verifica que el token se esté enviando en los headers
- Asegúrate de que `isLoaded` sea `true` antes de hacer requests

### Error de Content Security Policy (CSP)
Si ves un error como:
```
Refused to load the script 'https://www.google.com/recaptcha/api.js' because it violates the following Content Security Policy directive
```

**Solución:** La CSP ya está configurada en `next.config.mjs` para permitir reCAPTCHA. Si sigues teniendo problemas:

1. **Reinicia el servidor de desarrollo** después de cambiar la configuración
2. **Limpia la caché del navegador**
3. **Verifica que no haya otras políticas de seguridad** en tu hosting

### Scores consistentemente bajos
- Verifica que el dominio esté correctamente configurado
- Considera ajustar el umbral temporalmente
- Revisa si hay problemas de red o JavaScript

## Desarrollo Local

### **Opción 1: Claves de Prueba (Rápido)**
Para desarrollo local, puedes usar las claves de prueba de Google:

```env
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

**Nota:** Estas claves pueden dar scores bajos. Usa umbral bajo (0.1) para desarrollo.

### **Opción 2: Claves Reales (Recomendado)**
Para mejor funcionamiento, obtén claves reales siguiendo la guía en `docs/RECAPTCHA_KEYS_SETUP.md`

## 🔧 **Gestión de Umbrales**

### **Cambiar Umbrales Automáticamente**
```bash
# Para desarrollo (umbral bajo)
node scripts/update-thresholds.js development

# Para producción (umbral estándar)
node scripts/update-thresholds.js production

# Ver umbrales actuales
node scripts/update-thresholds.js show
```

### **Umbrales por Entorno**
- **Desarrollo**: 0.1 (permite más actividad)
- **Producción**: 0.5 (protección estándar)
- **Alta Seguridad**: 0.7 (protección estricta) 