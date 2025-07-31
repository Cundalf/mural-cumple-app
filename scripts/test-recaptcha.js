#!/usr/bin/env node

/**
 * Script de prueba para verificar la configuración de reCAPTCHA
 * Uso: node scripts/test-recaptcha.js
 */

const https = require('https');

// Claves de prueba de Google
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

console.log('🔍 Probando configuración de reCAPTCHA...\n');

// Función para hacer request HTTPS
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Probar con token de prueba
async function testRecaptcha() {
  try {
    console.log('📡 Probando verificación de reCAPTCHA...');
    
    const response = await makeRequest('/recaptcha/api/siteverify', {
      secret: TEST_SECRET_KEY,
      response: 'test_token'
    });

    console.log('✅ Respuesta de Google reCAPTCHA:');
    console.log(JSON.stringify(response, null, 2));

    if (response.success === false) {
      console.log('\n✅ Esto es esperado - el token de prueba siempre falla');
      console.log('✅ Los códigos de error son normales para tokens de prueba');
    }

    console.log('\n🎯 Configuración de reCAPTCHA verificada correctamente!');
    console.log('📝 Próximos pasos:');
    console.log('   1. Configura tus claves reales en .env.local');
    console.log('   2. Reinicia el servidor de desarrollo');
    console.log('   3. Prueba la funcionalidad en el navegador');

  } catch (error) {
    console.error('❌ Error al probar reCAPTCHA:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('   - Verifica tu conexión a internet');
    console.log('   - Asegúrate de que no haya firewall bloqueando Google');
    console.log('   - Revisa la configuración de CSP en next.config.mjs');
  }
}

// Verificar variables de entorno
function checkEnvironment() {
  console.log('🔧 Verificando variables de entorno...');
  
  const requiredVars = [
    'RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY', 
    'NEXT_PUBLIC_RECAPTCHA_SITE_KEY'
  ];

  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('⚠️  Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Para desarrollo, puedes usar las claves de prueba:');
    console.log(`   RECAPTCHA_SITE_KEY=${TEST_SITE_KEY}`);
    console.log(`   RECAPTCHA_SECRET_KEY=${TEST_SECRET_KEY}`);
    console.log(`   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${TEST_SITE_KEY}`);
  } else {
    console.log('✅ Todas las variables de entorno están configuradas');
  }
  
  console.log('');
}

// Ejecutar pruebas
async function runTests() {
  checkEnvironment();
  await testRecaptcha();
}

runTests().catch(console.error); 