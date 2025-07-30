'use client'

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback
} from 'react'

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark'
  size?: 'normal' | 'compact'
  className?: string
  autoResetOnError?: boolean
  maxRetries?: number
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
          callback: (token: string) => void
          'error-callback': (error: string) => void
          'expired-callback': () => void
          'unsupported-callback'?: () => void
          'timeout-callback'?: () => void
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
      execute: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
    turnstileState: 'unloaded' | 'loading' | 'loaded' | 'error'
    onTurnstileLoaded?: () => void
    onTurnstileError?: () => void
  }
}

interface TurnstileRef {
  reset: () => void
  execute: () => void
  getResponse: () => string | null
}

const SCRIPT_LOAD_TIMEOUT = 15000
const RETRY_DELAY = 2000

const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  (
    {
      siteKey,
      onVerify,
      onError,
      onExpire,
      theme = 'light',
      size = 'normal',
      className = '',
      autoResetOnError = true,
      maxRetries = 3
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [widgetId, setWidgetId] = useState<string | null>(null)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [isRendering, setIsRendering] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [isDestroyed, setIsDestroyed] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [scriptError, setScriptError] = useState<string | null>(null)
    const scriptTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    
    // Resetear isDestroyed cuando el componente se monta
    useEffect(() => {
      setIsDestroyed(false)
      setScriptError(null)
      
      // Monitor para errores globales que podrían afectar Turnstile
      const handleGlobalError = (event: ErrorEvent) => {
        if (event.message.includes('turnstile') || event.message.includes('cloudflare')) {
          console.error('🚨 Error global relacionado a Turnstile:', event.message)
        }
      }
      
      // Escuchar eventos personalizados de carga de script
      const handleTurnstileLoaded = () => {
        console.log('📡 Evento turnstileLoaded recibido')
        setIsScriptLoaded(true)
        setScriptError(null)
      }
      
      const handleTurnstileError = () => {
        console.error('📡 Evento turnstileError recibido')
        setScriptError('Error al cargar el script de verificación')
        onError?.('Error al cargar el script de verificación')
      }
      
      window.addEventListener('error', handleGlobalError)
      window.addEventListener('turnstileLoaded', handleTurnstileLoaded)
      window.addEventListener('turnstileError', handleTurnstileError)
      
      return () => {
        window.removeEventListener('error', handleGlobalError)
        window.removeEventListener('turnstileLoaded', handleTurnstileLoaded)
        window.removeEventListener('turnstileError', handleTurnstileError)
      }
    }, [onError])

    const cleanup = useCallback(() => {
      if (scriptTimeoutRef.current) {
        clearTimeout(scriptTimeoutRef.current)
        scriptTimeoutRef.current = undefined
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = undefined
      }
    }, [])

    const destroyWidget = useCallback(() => {
      if (widgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId)
        } catch (error) {
          console.warn('Error al remover widget Turnstile:', error)
        }
      }
      setWidgetId(null)
      setIsRendering(false)
    }, [widgetId])

    const forceRetry = useCallback(() => {
      if (isResetting) {
        console.log('⚠️ Reset ya en progreso, ignorando retry automático')
        return
      }
      
      console.log('🔄 Forzando recreación del widget...')
      setIsResetting(true)
      
      destroyWidget()
      setIsRendering(false)
      
      // Recrear después de un delay
      setTimeout(() => {
        if (!isDestroyed) {
          setIsRendering(false) // Permitir recreación
          setIsResetting(false) // Permitir futuros resets
        }
      }, 1000)
    }, [destroyWidget, isDestroyed, isResetting])

    const handleError = useCallback((error: string, shouldRetry = true) => {
      console.error('Turnstile error:', error)
      
      if (isResetting) {
        console.log('⚠️ Reset en progreso, ignorando error')
        return
      }
      
      if (shouldRetry && retryCount < maxRetries && !isDestroyed) {
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)
        
        onError?.(`Error en la verificación. Reintentando... (${newRetryCount}/${maxRetries})`)
        
        // Programar reintento solo si no hay reset en progreso
        retryTimeoutRef.current = setTimeout(() => {
          if (!isResetting) {
            forceRetry()
          }
        }, 2000)
      } else {
        // Si ya no hay más reintentos, resetear completamente
        console.log('🚫 Máximo de reintentos alcanzado')
        setRetryCount(0)
        destroyWidget()
        setIsRendering(false)
        setIsResetting(false)
        onError?.(error)
      }
    }, [retryCount, maxRetries, isDestroyed, onError, forceRetry, isResetting])

    // Función de renderizado estable sin useCallback para evitar problemas de dependencias
    const renderWidget = () => {
      if (!isScriptLoaded || !containerRef.current || !siteKey || isRendering || isDestroyed || isResetting) {
        return
      }

      if (!window.turnstile) {
        console.warn('Turnstile script no disponible')
        return
      }

      setIsRendering(true)

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            console.log('✅ Token recibido exitosamente')
            setRetryCount(0)
            onVerify(token)
          },
          'error-callback': (errorCode: string) => {
            if (!isDestroyed) {
              let errorMessage = 'Error en la verificación. Inténtalo de nuevo.'
              
              switch (errorCode) {
                case '110000':
                  errorMessage = 'Token de verificación inválido o expirado.'
                  break
                case '110001':
                  errorMessage = 'Token de verificación ya usado.'
                  break
                case '110002':
                  errorMessage = 'Dominio no autorizado.'
                  break
                case '110003':
                  errorMessage = 'Clave de sitio inválida.'
                  break
                case '110004':
                  errorMessage = 'Token de verificación malformado.'
                  break
                case '110005':
                  errorMessage = 'Token de verificación no encontrado.'
                  break
                case '110006':
                  errorMessage = 'Error interno del servidor.'
                  break
                case '110007':
                  errorMessage = 'Token de verificación expirado.'
                  break
                case '300030':
                  errorMessage = 'Tiempo de espera agotado en la verificación.'
                  break
                default:
                  errorMessage = `Error de verificación (${errorCode})`
              }

              handleError(errorMessage, autoResetOnError)
            }
          },
          'expired-callback': () => {
            if (!isDestroyed) {
              onExpire?.()
              if (autoResetOnError) {
                setTimeout(() => {
                  if (!isDestroyed && widgetId) {
                    try {
                      window.turnstile.reset(widgetId)
                    } catch (error) {
                      console.warn('Error al resetear widget expirado:', error)
                      destroyWidget()
                    }
                  }
                }, 100)
              }
            }
          },
          'unsupported-callback': () => {
            if (!isDestroyed) {
              handleError('Tu navegador no es compatible con la verificación.', false)
            }
          },
          'timeout-callback': () => {
            if (!isDestroyed) {
              handleError('La verificación tardó demasiado tiempo.', autoResetOnError)
            }
          }
        })
        
        setWidgetId(id)
        setIsRendering(false)
        
      } catch (error) {
        setIsRendering(false)
        console.error('❌ Error al renderizar Turnstile:', error)
        handleError('No se pudo cargar la verificación. Recarga la página.', false)
      }
    }

    // Verificar estado del script de Turnstile
    useEffect(() => {
      if (typeof window === 'undefined' || isDestroyed) return

      // Verificar si el script ya está cargado
      if (window.turnstileState === 'loaded' && window.turnstile) {
        setIsScriptLoaded(true)
        return
      }

      // Verificar si hay un script existente
      const existingScript = document.querySelector('script[src*="turnstile"]')
      if (existingScript && window.turnstile) {
        setIsScriptLoaded(true)
        return
      }

      // Si el script está cargándose, esperar
      if (window.turnstileState === 'loading') {
        const checkInterval = setInterval(() => {
          if (window.turnstileState === 'loaded' && window.turnstile) {
            setIsScriptLoaded(true)
            clearInterval(checkInterval)
          } else if (window.turnstileState === 'error') {
            setScriptError('Error al cargar el script de verificación')
            clearInterval(checkInterval)
          }
        }, 100)
        
        return () => clearInterval(checkInterval)
      }

      // Si no hay script y no está cargándose, configurar timeout
      if (!existingScript && !window.turnstileState) {
        scriptTimeoutRef.current = setTimeout(() => {
          if (!window.turnstile) {
            setScriptError('Tiempo de espera agotado al cargar la verificación')
            onError?.('Tiempo de espera agotado al cargar la verificación')
          }
        }, SCRIPT_LOAD_TIMEOUT)
      }

      return () => {
        cleanup()
      }
    }, [isDestroyed, onError, cleanup])

    // Renderizar widget cuando el script esté listo
    useEffect(() => {
      if (isScriptLoaded && !widgetId && !isRendering && !isDestroyed && !isResetting && containerRef.current && siteKey) {
        renderWidget()
      }
    }, [isScriptLoaded, widgetId, isRendering, isDestroyed, isResetting, siteKey])

    // Cleanup al desmontar
    useEffect(() => {
      return () => {
        setIsDestroyed(true)
        cleanup()
        // NO destruir widget inmediatamente en desarrollo para evitar Fast Refresh issues
        if (process.env.NODE_ENV === 'production') {
          destroyWidget()
        } else {
          // En desarrollo, delay la destrucción para evitar conflictos con Fast Refresh
          setTimeout(() => {
            if (widgetId && window.turnstile?.remove) {
              try {
                window.turnstile.remove(widgetId)
              } catch (error) {
                console.warn('Error limpiando widget:', error)
              }
            }
          }, 500)
        }
      }
    }, [cleanup, destroyWidget, widgetId])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (isDestroyed || isResetting) {
          console.log('⚠️ Reset ignorado - Widget destruido o reset en progreso')
          return
        }
        
        console.log('🔄 Reset manual solicitado')
        setIsResetting(true)
        
        // Cancelar cualquier timeout pendiente
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
          retryTimeoutRef.current = undefined
        }
        
        try {
          // Destruir widget completamente
          destroyWidget()
          
          // Limpiar estados
          setRetryCount(0)
          setIsRendering(false)
          
          console.log('✅ Reset manual completado')
          
          // Permitir recreación después de un delay
          setTimeout(() => {
            if (!isDestroyed) {
              setIsResetting(false)
              setIsRendering(false) // Esto debería triggear recreación
            }
          }, 1500)
          
        } catch (error) {
          console.error('❌ Error en reset manual:', error)
          setIsResetting(false)
        }
      },
      execute: () => {
        if (!widgetId || !window.turnstile || isDestroyed) return
        
        try {
          window.turnstile.execute(widgetId)
        } catch (error) {
          console.error('Error al ejecutar Turnstile:', error)
        }
      },
      getResponse: () => {
        if (!widgetId || !window.turnstile || isDestroyed) return null
        
        try {
          return window.turnstile.getResponse(widgetId)
        } catch (error) {
          console.error('Error al obtener respuesta de Turnstile:', error)
          return null
        }
      }
    }), [widgetId, isDestroyed, destroyWidget])

    if (!siteKey) {
      return (
        <div className={`p-4 border-dashed border-2 rounded-md ${className}`}>
          <p className='text-sm text-center text-yellow-600'>
            Advertencia: La sitekey de Turnstile no está configurada.
          </p>
        </div>
      )
    }

    if (scriptError) {
      return (
        <div className={`p-4 border-dashed border-2 border-red-300 rounded-md ${className}`}>
          <p className='text-sm text-center text-red-600'>
            Error: {scriptError}
          </p>
          <button 
            onClick={() => {
              setScriptError(null)
              window.location.reload()
            }}
            className='mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200'
          >
            Recargar página
          </button>
        </div>
      )
    }

    return (
      <div className={`turnstile-container ${className}`}>
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            minHeight: '65px'
          }} 
        />
        {isRendering && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Cargando verificación...</span>
          </div>
        )}
      </div>
    )
  }
)

Turnstile.displayName = 'Turnstile'

export { Turnstile }
export type { TurnstileRef }
