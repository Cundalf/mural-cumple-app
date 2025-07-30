#!/usr/bin/env node

/**
 * Script para verificar la configuración de Cloudflare Turnstile
 * Uso: node scripts/check-turnstile.js
 */

console.log('🔍 Verificando configuración de Cloudflare Turnstile...\n')

// Verificar variables de entorno
const requiredEnvVars = [
  'NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY'
]

const optionalEnvVars = [
  'NEXT_PUBLIC_DISABLE_TURNSTILE',
  'DISABLE_TURNSTILE'
]

console.log('📋 Variables de entorno requeridas:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
  }
})

console.log('\n📋 Variables de entorno opcionales:')
optionalEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`ℹ️  ${varName}: ${value}`)
  } else {
    console.log(`ℹ️  ${varName}: no configurada (usando valor por defecto)`)
  }
})

// Verificar si Turnstile está deshabilitado
const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true' || 
                   process.env.DISABLE_TURNSTILE === 'true'

console.log(`\n🚦 Estado de Turnstile: ${isDisabled ? 'DESHABILITADO' : 'HABILITADO'}`)

if (isDisabled) {
  console.log('⚠️  Turnstile está deshabilitado. Para habilitarlo:')
  console.log('   - Establece NEXT_PUBLIC_DISABLE_TURNSTILE=false')
  console.log('   - Establece DISABLE_TURNSTILE=false')
  console.log('   - Asegúrate de que las claves estén configuradas')
} else {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  
  if (!siteKey || !secretKey) {
    console.log('❌ Turnstile está habilitado pero faltan las claves:')
    if (!siteKey) console.log('   - NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY')
    if (!secretKey) console.log('   - CLOUDFLARE_TURNSTILE_SECRET_KEY')
  } else {
    console.log('✅ Turnstile está correctamente configurado')
  }
}

console.log('\n📝 Para configurar las variables de entorno:')
console.log('1. Copia env.example a .env')
console.log('2. Configura tus claves de Cloudflare Turnstile')
console.log('3. Para Docker, asegúrate de que el .env esté en el directorio raíz')

console.log('\n🔧 Para Docker:')
console.log('docker-compose up --build')

console.log('\n🔧 Para desarrollo local:')
console.log('npm run dev') 