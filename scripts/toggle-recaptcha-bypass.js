#!/usr/bin/env node

/**
 * Script para habilitar/deshabilitar el bypass de reCAPTCHA
 * Uso: node scripts/toggle-recaptcha-bypass.js [enable|disable|status]
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = '.env.local';
const ACTION = process.argv[2] || 'status';

function readEnvFile() {
  const envPath = path.join(process.cwd(), ENV_FILE);
  
  if (!fs.existsSync(envPath)) {
    console.log(`📄 Archivo ${ENV_FILE} no encontrado. Creando...`);
    return '';
  }
  
  return fs.readFileSync(envPath, 'utf8');
}

function writeEnvFile(content) {
  const envPath = path.join(process.cwd(), ENV_FILE);
  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`✅ Archivo ${ENV_FILE} actualizado`);
}

function updateBypassSettings(enable) {
  let content = readEnvFile();
  
  // Buscar y reemplazar o agregar las variables
  const bypassBackend = `RECAPTCHA_BYPASS=${enable}`;
  const bypassFrontend = `NEXT_PUBLIC_RECAPTCHA_BYPASS=${enable}`;
  
  // Actualizar RECAPTCHA_BYPASS
  if (content.includes('RECAPTCHA_BYPASS=')) {
    content = content.replace(/RECAPTCHA_BYPASS=.*/g, bypassBackend);
  } else {
    content += `\n# Bypass de reCAPTCHA (SOLO para desarrollo/emergencias)\n${bypassBackend}`;
  }
  
  // Actualizar NEXT_PUBLIC_RECAPTCHA_BYPASS
  if (content.includes('NEXT_PUBLIC_RECAPTCHA_BYPASS=')) {
    content = content.replace(/NEXT_PUBLIC_RECAPTCHA_BYPASS=.*/g, bypassFrontend);
  } else {
    content += `\n${bypassFrontend}`;
  }
  
  writeEnvFile(content);
  
  const status = enable ? 'habilitado' : 'deshabilitado';
  console.log(`\n🎯 Bypass de reCAPTCHA ${status}`);
  
  if (enable) {
    console.log('⚠️  ADVERTENCIA: reCAPTCHA está deshabilitado');
    console.log('⚠️  Solo usar para desarrollo o situaciones de emergencia');
    console.log('⚠️  NUNCA usar en producción');
  } else {
    console.log('✅ reCAPTCHA está habilitado y funcionando');
  }
}

function showStatus() {
  const content = readEnvFile();
  
  const backendBypass = content.match(/RECAPTCHA_BYPASS=(.*)/);
  const frontendBypass = content.match(/NEXT_PUBLIC_RECAPTCHA_BYPASS=(.*)/);
  
  console.log('📊 Estado del Bypass de reCAPTCHA:\n');
  
  if (backendBypass) {
    const status = backendBypass[1] === 'true' ? '🔴 HABILITADO' : '🟢 DESHABILITADO';
    console.log(`Backend (RECAPTCHA_BYPASS): ${status}`);
  } else {
    console.log('Backend (RECAPTCHA_BYPASS): ⚪ NO CONFIGURADO');
  }
  
  if (frontendBypass) {
    const status = frontendBypass[1] === 'true' ? '🔴 HABILITADO' : '🟢 DESHABILITADO';
    console.log(`Frontend (NEXT_PUBLIC_RECAPTCHA_BYPASS): ${status}`);
  } else {
    console.log('Frontend (NEXT_PUBLIC_RECAPTCHA_BYPASS): ⚪ NO CONFIGURADO');
  }
  
  console.log('\n💡 Comandos disponibles:');
  console.log('  node scripts/toggle-recaptcha-bypass.js enable   - Habilitar bypass');
  console.log('  node scripts/toggle-recaptcha-bypass.js disable  - Deshabilitar bypass');
  console.log('  node scripts/toggle-recaptcha-bypass.js status   - Ver estado actual');
}

// Ejecutar acción
switch (ACTION.toLowerCase()) {
  case 'enable':
  case 'on':
  case 'true':
    updateBypassSettings(true);
    break;
    
  case 'disable':
  case 'off':
  case 'false':
    updateBypassSettings(false);
    break;
    
  case 'status':
  default:
    showStatus();
    break;
}

console.log('\n🔄 Recuerda reiniciar el servidor después de cambiar la configuración:');
console.log('   npm run dev'); 