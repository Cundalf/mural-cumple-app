#!/usr/bin/env node

/**
 * Script simple para probar Turnstile en producción
 * Uso: node scripts/test-turnstile-production.js
 */

console.log('🧪 PRUEBA TURNSTILE PRODUCCIÓN');
console.log('==============================\n');

// Verificar variables de entorno
const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true';

console.log('1. CONFIGURACIÓN:');
console.log('-----------------');
console.log(`Site Key configurada: ${siteKey ? '✅' : '❌'}`);
console.log(`Turnstile deshabilitado: ${isDisabled ? '⚠️ SÍ' : '✅ NO'}`);

if (siteKey) {
  console.log(`Site Key: ${siteKey.substring(0, 10)}...`);
  console.log(`Longitud: ${siteKey.length} caracteres`);
}

console.log('\n2. VERIFICACIÓN DE RED:');
console.log('------------------------');

// Verificar que se puede acceder a Cloudflare
const https = require('https');

function testCloudflareAccess() {
  return new Promise((resolve) => {
    const req = https.get('https://challenges.cloudflare.com/turnstile/v0/api.js', (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(res.statusCode === 200);
    });

    req.on('error', (err) => {
      console.error('Error:', err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.error('Timeout');
      req.destroy();
      resolve(false);
    });
  });
}

testCloudflareAccess().then((success) => {
  console.log(`Acceso a Cloudflare: ${success ? '✅' : '❌'}`);
  
  console.log('\n3. RESUMEN:');
  console.log('------------');
  
  if (!siteKey) {
    console.log('❌ PROBLEMA: Site key no configurada');
    console.log('   Solución: Configura NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY');
  } else if (isDisabled) {
    console.log('⚠️  ADVERTENCIA: Turnstile está deshabilitado');
    console.log('   Para habilitar: elimina NEXT_PUBLIC_DISABLE_TURNSTILE=true');
  } else if (!success) {
    console.log('❌ PROBLEMA: No se puede acceder a Cloudflare');
    console.log('   Verifica tu conexión a internet');
  } else {
    console.log('✅ CONFIGURACIÓN CORRECTA');
    console.log('   Turnstile debería funcionar en producción');
  }
  
  console.log('\n4. PRÓXIMOS PASOS:');
  console.log('-------------------');
  console.log('1. Haz build y deploy de la aplicación');
  console.log('2. Verifica que Turnstile se renderice en producción');
  console.log('3. Si persiste el problema, revisa la consola del navegador');
  console.log('4. Verifica que el dominio esté autorizado en Cloudflare');
}); 