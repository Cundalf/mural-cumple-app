'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface TurnstileProps {
  siteKey: string
  onVerify?: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark'
  size?: 'normal' | 'compact'
  className?: string
}

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark'
          size?: 'normal' | 'compact'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId: string) => void
    }
  }
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  className = ''
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [widgetId, setWidgetId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar si Turnstile ya está cargado
    if (window.turnstile) {
      setIsLoaded(true)
      setIsLoading(false)
      return
    }

    // Esperar a que se cargue el script
    const checkTurnstile = () => {
      if (window.turnstile) {
        setIsLoaded(true)
        setIsLoading(false)
      } else {
        setTimeout(checkTurnstile, 100)
      }
    }
    checkTurnstile()

    // Timeout para evitar esperar indefinidamente
    const timeout = setTimeout(() => {
      if (!window.turnstile) {
        const errorMessage = 'No se pudo cargar la verificación de seguridad. Por favor, recarga la página.'
        setError(errorMessage)
        setIsLoading(false)
        toast({
          title: "Error de carga",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }, 10000) // 10 segundos de timeout

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !siteKey || widgetId) return

    // Verificar si ya hay un widget en este contenedor
    const existingWidget = containerRef.current.querySelector('[data-turnstile-widget-id]')
    if (existingWidget) {
      return
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          setError(null) // Limpiar errores previos
          onVerify?.(token)
        },
        'expired-callback': () => {
          const errorMessage = 'La verificación ha expirado. Por favor, completa la verificación nuevamente.'
          setError(errorMessage)
          onExpire?.()
          toast({
            title: "Verificación expirada",
            description: errorMessage,
            variant: "destructive",
          })
        },
        'error-callback': () => {
          const errorMessage = 'Error en la verificación. Por favor, intenta nuevamente o recarga la página.'
          setError(errorMessage)
          onError?.(errorMessage)
          toast({
            title: "Error de verificación",
            description: errorMessage,
            variant: "destructive",
          })
        }
      })
      setWidgetId(id)
      
      // Marcar el contenedor como que ya tiene un widget
      containerRef.current.setAttribute('data-turnstile-widget-id', id)
    } catch (error) {
      const errorMessage = 'Error al cargar la verificación. Por favor, recarga la página.'
      console.error('Error al renderizar Turnstile:', error)
      setError(errorMessage)
      onError?.(errorMessage)
      toast({
        title: "Error de carga",
        description: errorMessage,
        variant: "destructive",
      })
    }

    // Cleanup function
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.reset(widgetId)
          if (containerRef.current) {
            containerRef.current.removeAttribute('data-turnstile-widget-id')
          }
        } catch (error) {
          console.error('Error al limpiar Turnstile:', error)
        }
      }
    }
  }, [isLoaded, siteKey, theme, size, onVerify, onExpire, onError, widgetId])

  const reset = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
      setWidgetId(null) // Resetear el widgetId para permitir re-renderizado
      setError(null) // Limpiar errores al resetear
    }
  }

  const retry = () => {
    setError(null)
    setIsLoading(true)
    setIsLoaded(false)
    setWidgetId(null)
    
    // Forzar recarga del script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      const errorMessage = 'No se pudo cargar la verificación. Verifica tu conexión a internet.'
      setError(errorMessage)
      setIsLoading(false)
      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      })
    }
    document.head.appendChild(script)
  }

  // Verificar si Turnstile está deshabilitado por variable de entorno
  const isTurnstileDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
  
  // Si Turnstile está deshabilitado, mostrar solo en consola y retornar null
  if (isTurnstileDisabled) {
    console.log('🔓 Turnstile deshabilitado - modo desarrollo')
    return null
  }

  // Si no hay site key configurada, mostrar mensaje
  if (!siteKey) {
    return (
      <div className={`turnstile-container ${className}`}>
        <div className="text-sm text-muted-foreground p-4 border border-dashed border-gray-300 rounded-lg text-center">
          ⚠️ Turnstile no configurado. Agrega NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY en tu .env.local
        </div>
      </div>
    )
  }

  return (
    <div className={`turnstile-container ${className}`}>
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm font-medium text-red-800">Error de verificación</span>
          </div>
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={retry}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="turnstile-widget" />
          {isLoading && (
            <div className="text-sm text-muted-foreground p-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Cargando verificación...
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Hook para usar Turnstile en formularios
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Verificar si Turnstile está deshabilitado
  const isTurnstileDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'

  const handleVerify = useCallback((turnstileToken: string) => {
    setToken(turnstileToken)
    setIsVerifying(false)
    setError(null) // Limpiar errores al verificar exitosamente
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    console.error('Turnstile error:', errorMessage)
    setError(errorMessage)
    setIsVerifying(false)
    setToken(null)
    toast({
      title: "Error de verificación",
      description: errorMessage,
      variant: "destructive",
    })
  }, [toast])

  const handleExpire = useCallback(() => {
    setToken(null)
    setIsVerifying(false)
    const errorMessage = 'La verificación ha expirado. Por favor, completa la verificación nuevamente.'
    setError(errorMessage)
    toast({
      title: "Verificación expirada",
      description: errorMessage,
      variant: "destructive",
    })
  }, [toast])

  const reset = useCallback(() => {
    setToken(null)
    setIsVerifying(false)
    setError(null)
  }, [])

  return {
    token: isTurnstileDisabled ? 'disabled' : token, // Token simulado cuando está deshabilitado
    isVerifying,
    error,
    handleVerify,
    handleError,
    handleExpire,
    reset,
    isDisabled: isTurnstileDisabled
  }
} 