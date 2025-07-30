'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Alert, AlertDescription } from './alert'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Info } from 'lucide-react'

interface TurnstileDebugProps {
  siteKey: string
  className?: string
}

interface DebugInfo {
  scriptLoaded: boolean
  turnstileAvailable: boolean
  siteKeyConfigured: boolean
  domainAuthorized: boolean
  networkAccessible: boolean
  errors: string[]
}

export function TurnstileDebug({ siteKey, className = '' }: TurnstileDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    scriptLoaded: false,
    turnstileAvailable: false,
    siteKeyConfigured: false,
    domainAuthorized: false,
    networkAccessible: false,
    errors: []
  })
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    const errors: string[] = []
    const newDebugInfo: DebugInfo = {
      scriptLoaded: false,
      turnstileAvailable: false,
      siteKeyConfigured: false,
      domainAuthorized: false,
      networkAccessible: false,
      errors: []
    }

    try {
      // 1. Verificar si el script está cargado
      const scriptElement = document.querySelector('script[src*="turnstile"]')
      newDebugInfo.scriptLoaded = !!scriptElement
      
      if (!scriptElement) {
        errors.push('Script de Turnstile no encontrado en el DOM')
      }

      // 2. Verificar si Turnstile está disponible globalmente
      newDebugInfo.turnstileAvailable = !!(window as any).turnstile
      
      if (!(window as any).turnstile) {
        errors.push('Objeto turnstile no disponible en window')
      }

      // 3. Verificar si la site key está configurada
      newDebugInfo.siteKeyConfigured = !!siteKey && siteKey.length > 10
      
      if (!siteKey) {
        errors.push('Site key no configurada')
      } else if (siteKey.length <= 10) {
        errors.push('Site key parece ser inválida (muy corta)')
      }

      // 4. Verificar acceso a la red de Cloudflare
      try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/api.js', {
          method: 'HEAD',
          mode: 'no-cors'
        })
        newDebugInfo.networkAccessible = true
      } catch (error) {
        errors.push('No se puede acceder a la red de Cloudflare')
        newDebugInfo.networkAccessible = false
      }

      // 5. Verificar estado del script
      if ((window as any).turnstileState) {
        if ((window as any).turnstileState === 'error') {
          errors.push('Estado del script: ERROR')
        } else if ((window as any).turnstileState === 'loaded') {
          newDebugInfo.domainAuthorized = true // Asumimos que si se cargó, el dominio está autorizado
        }
      }

      // 6. Verificar errores en la consola relacionados con Turnstile
      const originalError = console.error
      const turnstileErrors: string[] = []
      
      console.error = (...args) => {
        const message = args.join(' ')
        if (message.toLowerCase().includes('turnstile') || message.toLowerCase().includes('cloudflare')) {
          turnstileErrors.push(message)
        }
        originalError.apply(console, args)
      }

      // Restaurar console.error después de un breve delay
      setTimeout(() => {
        console.error = originalError
        if (turnstileErrors.length > 0) {
          errors.push(`Errores en consola: ${turnstileErrors.join(', ')}`)
        }
      }, 100)

    } catch (error) {
      errors.push(`Error durante el diagnóstico: ${error}`)
    }

    newDebugInfo.errors = errors
    setDebugInfo(newDebugInfo)
    setIsLoading(false)
  }

  useEffect(() => {
    // Solo mostrar en desarrollo o si hay una variable de entorno específica
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      process.env.NEXT_PUBLIC_SHOW_TURNSTILE_DEBUG === 'true'
    setIsVisible(shouldShow)
    
    if (shouldShow) {
      runDiagnostics()
    }
  }, [siteKey])

  if (!isVisible) {
    return null
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        OK
      </Badge>
    ) : (
      <Badge variant="destructive">
        Error
      </Badge>
    )
  }

  return (
    <Card className={`border-2 border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Diagnóstico Turnstile
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={runDiagnostics}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(debugInfo.scriptLoaded)}
              Script cargado
            </span>
            {getStatusBadge(debugInfo.scriptLoaded)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(debugInfo.turnstileAvailable)}
              API disponible
            </span>
            {getStatusBadge(debugInfo.turnstileAvailable)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(debugInfo.siteKeyConfigured)}
              Site key configurada
            </span>
            {getStatusBadge(debugInfo.siteKeyConfigured)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(debugInfo.networkAccessible)}
              Red accesible
            </span>
            {getStatusBadge(debugInfo.networkAccessible)}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(debugInfo.domainAuthorized)}
              Dominio autorizado
            </span>
            {getStatusBadge(debugInfo.domainAuthorized)}
          </div>
        </div>

        {debugInfo.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="space-y-1">
                {debugInfo.errors.map((error, index) => (
                  <div key={index} className="text-red-700">
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <strong>Site Key:</strong> {siteKey ? `${siteKey.substring(0, 10)}...` : 'No configurada'}
          </div>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <strong>Estado:</strong> {(window as any).turnstileState || 'Desconocido'}
          </div>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <strong>Entorno:</strong> {process.env.NODE_ENV}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>💡 Para ocultar este panel en producción, establece:</p>
          <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SHOW_TURNSTILE_DEBUG=false</code>
        </div>
      </CardContent>
    </Card>
  )
} 