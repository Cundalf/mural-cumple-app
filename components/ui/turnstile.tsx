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
    const scriptTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    
    // Resetear isDestroyed cuando el componente se monta
    useEffect(() => {
      setIsDestroyed(false)
      
      // Monitor para errores globales que podrían afectar Turnstile
      const handleGlobalError = (event: ErrorEvent) => {
        if (event.message.includes('turnstile') || event.message.includes('cloudflare')) {
          console.error('🚨 Error global relacionado a Turnstile:', event.message)
        }
      }
      
      window.addEventListener('error', handleGlobalError)
      
      return () => {
        window.removeEventListener('error', handleGlobalError)
      }
    }, [])

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

    const handleError = useCallback((error: string, shouldRetry = true) => {
      console.error('Turnstile error:', error)
      
      if (shouldRetry && retryCount < maxRetries && !isDestroyed) {
        setRetryCount(prev => prev + 1)
        
        retryTimeoutRef.current = setTimeout(() => {
          if (!isDestroyed) {
            destroyWidget()
            setIsRendering(false)
          }
        }, RETRY_DELAY)
        
        onError?.(`Error en la verificación. Reintentando... (${retryCount + 1}/${maxRetries})`)
      } else {
        onError?.(error)
      }
    }, [retryCount, maxRetries, isDestroyed, destroyWidget, onError])

    const renderWidget = useCallback(() => {
      if (!isScriptLoaded || !containerRef.current || !siteKey || isRendering || isDestroyed) {
        return
      }

      if (!window.turnstile) {

        return
      }

      setIsRendering(true)


      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
    
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
    }, [isScriptLoaded, siteKey, theme, size, onVerify, onExpire, handleError])

    // Cargar script de Turnstile (solo una vez globalmente)
    useEffect(() => {
      if (typeof window === 'undefined' || isDestroyed) return

      // Verificar si ya existe el script en el DOM
      const existingScript = document.querySelector('script[src*="turnstile"]')
      if (existingScript && window.turnstile) {
        setIsScriptLoaded(true)
        return
      }

      if (window.turnstileState === 'loaded' && window.turnstile) {
        setIsScriptLoaded(true)
        return
      }

      if (window.turnstileState === 'loading') {
        const checkInterval = setInterval(() => {
          if (window.turnstileState === 'loaded' && window.turnstile) {
            setIsScriptLoaded(true)
            clearInterval(checkInterval)
          } else if (window.turnstileState === 'error') {
            handleError('Error al cargar el script de verificación.', false)
            clearInterval(checkInterval)
          }
        }, 100)
        
        return () => clearInterval(checkInterval)
      }

      // Solo crear script si no existe
      if (!existingScript && !window.turnstileState) {
        window.turnstileState = 'loading'
        
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoaded'
        script.async = true
        script.defer = true
        script.id = 'turnstile-script'

        window.onTurnstileLoaded = () => {
          if (scriptTimeoutRef.current) {
            clearTimeout(scriptTimeoutRef.current)
            scriptTimeoutRef.current = undefined
          }
          window.turnstileState = 'loaded'
          setIsScriptLoaded(true)
        }

        script.onerror = () => {
          cleanup()
          window.turnstileState = 'error'
          handleError('Error al cargar el script de verificación.', false)
        }

        // Timeout para carga del script
        scriptTimeoutRef.current = setTimeout(() => {
          if (window.turnstileState === 'loading') {
            window.turnstileState = 'error'
            handleError('Tiempo de espera agotado al cargar la verificación.', false)
          }
        }, SCRIPT_LOAD_TIMEOUT)

      document.head.appendChild(script)
      }

      return () => {
        cleanup()
      }
    }, [isDestroyed, handleError, cleanup])

    // Renderizar widget cuando el script esté listo
    useEffect(() => {
      if (isScriptLoaded && !widgetId && !isRendering && !isDestroyed && containerRef.current && siteKey) {
        // Renderizar inline para evitar dependencias circulares
        if (!window.turnstile) {
  
          return
        }

        setIsRendering(true)

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => {
    
              setRetryCount(0)
              onVerify(token)
            },
            'error-callback': (errorCode: string) => {
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
                default:
                  errorMessage = `Error de verificación (${errorCode})`
              }

              handleError(errorMessage, autoResetOnError)
          },
          'expired-callback': () => {
            onExpire?.()
              if (autoResetOnError) {
                setTimeout(() => {
                  if (widgetId && window.turnstile) {
                    try {
                      window.turnstile.reset(widgetId)
                    } catch (error) {
                      console.warn('Error al resetear widget expirado:', error)
                    }
                  }
                }, 100)
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
    }, [isScriptLoaded, widgetId, isRendering, isDestroyed, siteKey, theme, size, onVerify, onExpire, handleError, autoResetOnError])

    // Cleanup al desmontar (solo al desmontar realmente)
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
        if (!widgetId || !window.turnstile || isDestroyed) return
        
          try {
            window.turnstile.reset(widgetId)
          setRetryCount(0)
        } catch (error) {
          console.error('Error al resetear Turnstile:', error)
          destroyWidget()
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
