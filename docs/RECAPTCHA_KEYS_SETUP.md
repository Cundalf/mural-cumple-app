# Configuración de Claves Reales de reCAPTCHA

## 🚀 **Paso a Paso para Obtener Claves Reales**

### 1. **Ir a Google reCAPTCHA Admin Console**
- Ve a: https://www.google.com/recaptcha/admin
- Inicia sesión con tu cuenta de Google

### 2. **Crear un Nuevo Sitio**
- Haz clic en el botón **"+"** o **"Agregar"**
- Completa la información:

```
Etiqueta del sitio: Mural de Cumpleaños
Tipo de reCAPTCHA: reCAPTCHA v3
Dominios: 
  - localhost (para desarrollo)
  - tu-dominio.com (para producción)
```

### 3. **Aceptar Términos y Crear**
- Marca la casilla de aceptación
- Haz clic en **"Enviar"**

### 4. **Copiar las Claves**
Te aparecerán dos claves:

```
Clave del sitio: 6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Clave secreta: 6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. **Configurar en tu Proyecto**

Crea o actualiza tu archivo `.env.local`:

```env
# Google reCAPTCHA v3 - CLAVES REALES
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui
RECAPTCHA_SECRET_KEY=tu_clave_secreta_aqui
RECAPTCHA_SITE_KEY=tu_clave_del_sitio_aqui
```

### 6. **Reiniciar el Servidor**
```bash
npm run dev
```

## 🔧 **Configuración de Umbrales por Entorno**

### **Desarrollo (umbral bajo)**
```typescript
threshold: 0.1 // Permite más actividad
```

### **Producción (umbral estándar)**
```typescript
threshold: 0.5 // Protección estándar
```

### **Alta Seguridad (umbral alto)**
```typescript
threshold: 0.7 // Protección estricta
```

## 📊 **Entendiendo los Scores de reCAPTCHA**

- **0.9 - 1.0**: Usuario muy confiable
- **0.7 - 0.9**: Usuario confiable
- **0.5 - 0.7**: Usuario moderadamente confiable
- **0.3 - 0.5**: Usuario sospechoso
- **0.0 - 0.3**: Bot o actividad maliciosa

## 🛠️ **Comandos para Cambiar Umbrales**

### **Para Desarrollo (umbral bajo)**
```bash
# Buscar y reemplazar en todos los archivos
find . -name "*.ts" -exec sed -i 's/threshold: 0\.5/threshold: 0.1/g' {} \;
```

### **Para Producción (umbral estándar)**
```bash
# Buscar y reemplazar en todos los archivos
find . -name "*.ts" -exec sed -i 's/threshold: 0\.1/threshold: 0.5/g' {} \;
```

## 🔍 **Verificar Configuración**

Ejecuta el script de prueba:
```bash
node scripts/test-recaptcha.js
```

## ⚠️ **Notas Importantes**

1. **Nunca compartas la clave secreta** en el frontend
2. **Usa HTTPS** en producción
3. **Configura correctamente los dominios** en Google reCAPTCHA
4. **Monitorea los scores** para ajustar umbrales
5. **Las claves de prueba** solo funcionan en dominios específicos

## 🎯 **Resultado Esperado**

Con las claves reales configuradas:
- ✅ Subida de archivos funcionando
- ✅ Envío de mensajes funcionando
- ✅ Eliminación funcionando
- ✅ Scores reales de reCAPTCHA
- ✅ Protección efectiva contra bots 