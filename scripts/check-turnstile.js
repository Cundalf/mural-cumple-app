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
let missingRequired = false
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`)
    missingRequired = true
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
    
    // Verificar formato de las claves
    if (siteKey && siteKey.length < 20) {
      console.log('⚠️  La site key parece ser muy corta. Verifica que sea correcta.')
    }
    
    if (secretKey && secretKey.length < 20) {
      console.log('⚠️  La secret key parece ser muy corta. Verifica que sea correcta.')
    }
  }
}

// Verificar entorno
console.log('\n🌍 Entorno de ejecución:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'no configurado'}`)
console.log(`   Platform: ${process.platform}`)
console.log(`   Node version: ${process.version}`)

// Verificar archivos de configuración
const fs = require('fs')
const path = require('path')

console.log('\n📁 Verificación de archivos:')

const filesToCheck = [
  '.env',
  '.env.local',
  '.env.production',
  'next.config.mjs',
  'package.json'
]

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: existe`)
    
    // Verificar contenido específico para algunos archivos
    if (file === 'next.config.mjs') {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY')) {
        console.log(`   ✅ ${file}: contiene configuración de Turnstile`)
      } else {
        console.log(`   ⚠️  ${file}: no contiene configuración de Turnstile`)
      }
    }
  } else {
    console.log(`❌ ${file}: no existe`)
  }
})

// Verificar dependencias
console.log('\n📦 Verificación de dependencias:')
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
  const hasNext = packageJson.dependencies?.next || packageJson.devDependencies?.next
  const hasReact = packageJson.dependencies?.react || packageJson.devDependencies?.react
  
  if (hasNext) {
    console.log(`✅ Next.js: ${hasNext}`)
  } else {
    console.log('❌ Next.js: no encontrado')
  }
  
  if (hasReact) {
    console.log(`✅ React: ${hasReact}`)
  } else {
    console.log('❌ React: no encontrado')
  }
} catch (error) {
  console.log('❌ Error leyendo package.json:', error.message)
}

// Recomendaciones específicas para producción
console.log('\n🚀 Recomendaciones para producción:')

if (process.env.NODE_ENV === 'production') {
  console.log('✅ Ejecutando en modo producción')
  
  if (missingRequired) {
    console.log('❌ FALTAN VARIABLES REQUERIDAS para producción:')
    console.log('   1. Configura NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY')
    console.log('   2. Configura CLOUDFLARE_TURNSTILE_SECRET_KEY')
    console.log('   3. Asegúrate de que las claves sean válidas en Cloudflare')
  } else {
    console.log('✅ Todas las variables requeridas están configuradas')
  }
  
  console.log('\n🔧 Pasos para solucionar problemas en producción:')
  console.log('   1. Verifica que las claves de Turnstile sean válidas')
  console.log('   2. Asegúrate de que el dominio esté autorizado en Cloudflare')
  console.log('   3. Revisa los logs del navegador para errores de JavaScript')
  console.log('   4. Verifica que el script se cargue correctamente')
  console.log('   5. Comprueba que no haya bloqueadores de anuncios activos')
} else {
  console.log('ℹ️  Ejecutando en modo desarrollo')
  console.log('   Para probar en producción, establece NODE_ENV=production')
}

console.log('\n📝 Para configurar las variables de entorno:')
console.log('1. Copia env.example a .env')
console.log('2. Configura tus claves de Cloudflare Turnstile')
console.log('3. Para Docker, asegúrate de que el .env esté en el directorio raíz')

console.log('\n🔧 Para Docker:')
console.log('docker-compose up --build')

console.log('\n🔧 Para desarrollo local:')
console.log('npm run dev')

console.log('\n🔧 Para verificar en el navegador:')
console.log('1. Abre las herramientas de desarrollador (F12)')
console.log('2. Ve a la pestaña Console')
console.log('3. Busca mensajes relacionados con "turnstile" o "cloudflare"')
console.log('4. Verifica que no haya errores de red en la pestaña Network')

// Si hay problemas, mostrar información adicional
if (missingRequired || isDisabled) {
  console.log('\n🚨 PROBLEMAS DETECTADOS:')
  if (missingRequired) {
    console.log('   - Faltan variables de entorno requeridas')
  }
  if (isDisabled) {
    console.log('   - Turnstile está deshabilitado')
  }
  console.log('\n💡 SOLUCIÓN:')
  console.log('   1. Configura las variables de entorno')
  console.log('   2. Habilita Turnstile si es necesario')
  console.log('   3. Reinicia la aplicación')
} 