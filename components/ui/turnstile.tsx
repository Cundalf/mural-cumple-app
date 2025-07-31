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
    const [showEmergencyButton, setShowEmergencyButton] = useState(false)
    
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
      console.log('🔧 Iniciando renderWidget...')
      
      if (!isScriptLoaded) {
        console.log('❌ Script no cargado')
        return
      }
      
      if (!containerRef.current) {
        console.log('❌ Container no disponible')
        return
      }
      
      if (!siteKey) {
        console.log('❌ Site key no disponible')
        return
      }
      
      if (isRendering) {
        console.log('❌ Ya está renderizando')
        return
      }
      
      if (isDestroyed) {
        console.log('❌ Componente destruido')
        return
      }
      
      if (isResetting) {
        console.log('❌ Reset en progreso')
        return
      }

      if (!window.turnstile) {
        console.warn('❌ Turnstile script no disponible')
        return
      }

      console.log('✅ Todas las condiciones cumplidas, iniciando renderizado...')
      setIsRendering(true)

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size,
          callback: (token: string) => {
            console.log('🎉 Turnstile verificado exitosamente con token:', token.substring(0, 20) + '...')
            onVerify(token)
          },
          'error-callback': (error: string) => {
            console.error('❌ Error en Turnstile:', error)
            setScriptError(error)
            if (onError) onError(error)
            
            if (autoResetOnError && retryCount < maxRetries) {
              console.log(`🔄 Reintentando en ${RETRY_DELAY}ms... (${retryCount + 1}/${maxRetries})`)
              retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1)
                setWidgetId(null)
                setIsRendering(false)
              }, RETRY_DELAY)
            }
          },
          'expired-callback': () => {
            console.log('⏰ Token de Turnstile expirado')
            if (onExpire) onExpire()
          },
          'unsupported-callback': () => {
            console.warn('⚠️ Navegador no soportado por Turnstile')
            setScriptError('Navegador no soportado')
            if (onError) onError('Navegador no soportado')
          }
        })
        
        console.log('✅ Widget renderizado exitosamente con ID:', id)
        setWidgetId(id)
        setIsRendering(false)
        
        // FORZAR VISIBILIDAD DEL CONTENEDOR
        if (containerRef.current) {
          containerRef.current.style.display = 'block'
          containerRef.current.style.visibility = 'visible'
          containerRef.current.style.opacity = '1'
          containerRef.current.style.minHeight = '65px'
          containerRef.current.style.width = '100%'
          
          // Buscar y forzar visibilidad del iframe si existe
          setTimeout(() => {
            const iframe = containerRef.current?.querySelector('iframe')
            if (iframe) {
              iframe.style.display = 'block'
              iframe.style.visibility = 'visible'
              iframe.style.opacity = '1'
              console.log('🔧 Iframe forzado a visible')
            }
          }, 100)
        }
        
      } catch (error) {
        setIsRendering(false)
        console.error('❌ Error al renderizar Turnstile:', error)
        handleError('No se pudo cargar la verificación. Recarga la página.', false)
      }
    }

    // Verificar estado del script de Turnstile
    useEffect(() => {
      if (typeof window === 'undefined' || isDestroyed) return

      // Función para verificar si Turnstile está listo
      const checkTurnstileReady = () => {
        return window.turnstile && window.turnstile.render
      }

      // Verificar si ya está cargado
      if (checkTurnstileReady()) {
        setIsScriptLoaded(true)
        return
      }

      // Escuchar eventos de carga
      const handleTurnstileLoaded = () => {
        if (checkTurnstileReady()) {
          setIsScriptLoaded(true)
          setScriptError(null)
        }
      }

      const handleTurnstileError = () => {
        setScriptError('Error al cargar el script de verificación')
        onError?.('Error al cargar el script de verificación')
      }

      // Verificar periódicamente si el script se cargó
      const checkInterval = setInterval(() => {
        if (checkTurnstileReady()) {
          setIsScriptLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)

      // Configurar timeout
      scriptTimeoutRef.current = setTimeout(() => {
        if (!checkTurnstileReady()) {
          setScriptError('Tiempo de espera agotado al cargar la verificación')
          onError?.('Tiempo de espera agotado al cargar la verificación')
        }
        clearInterval(checkInterval)
      }, SCRIPT_LOAD_TIMEOUT)

      // Escuchar eventos personalizados
      window.addEventListener('turnstileLoaded', handleTurnstileLoaded)
      window.addEventListener('turnstileError', handleTurnstileError)

      return () => {
        clearInterval(checkInterval)
        cleanup()
        window.removeEventListener('turnstileLoaded', handleTurnstileLoaded)
        window.removeEventListener('turnstileError', handleTurnstileError)
      }
    }, [isDestroyed, onError, cleanup])

    // Renderizar widget cuando el script esté listo
    useEffect(() => {
      if (isScriptLoaded && !widgetId && !isRendering && !isDestroyed && !isResetting && containerRef.current && siteKey) {
        console.log('🎯 Intentando renderizar widget Turnstile...')
        console.log('Estado actual:', {
          isScriptLoaded,
          widgetId,
          isRendering,
          isDestroyed,
          isResetting,
          hasContainer: !!containerRef.current,
          hasSiteKey: !!siteKey,
          turnstileAvailable: !!window.turnstile
        })
        renderWidget()
      }
    }, [isScriptLoaded, widgetId, isRendering, isDestroyed, isResetting, siteKey])

         // Verificar si el widget se renderizó correctamente después de un tiempo
     useEffect(() => {
       if (widgetId && containerRef.current) {
         const checkWidget = setTimeout(() => {
           const iframe = containerRef.current?.querySelector('iframe')
           const hasIframe = !!iframe
           const iframeSrc = iframe?.src || 'no-src'
           
           console.log('🔍 Verificación post-renderizado:', {
             widgetId,
             hasIframe,
             iframeSrc: iframeSrc.substring(0, 100) + '...',
             containerChildren: containerRef.current?.children.length || 0
           })
           
           if (!hasIframe) {
             console.warn('⚠️ Widget renderizado pero no se detecta iframe')
           }
           
           // DIAGNÓSTICO PROFESIONAL EN PRODUCCIÓN
           if (process.env.NODE_ENV === 'production' && hasIframe) {
             const diagnoseProductionIssue = () => {
               const computedStyle = window.getComputedStyle(iframe)
               const rect = iframe.getBoundingClientRect()
               
               console.log('🔍 DIAGNÓSTICO PRODUCCIÓN:', {
                 // Estilos básicos
                 display: computedStyle.display,
                 visibility: computedStyle.visibility,
                 opacity: computedStyle.opacity,
                 position: computedStyle.position,
                 zIndex: computedStyle.zIndex,
                 
                 // Dimensiones
                 width: computedStyle.width,
                 height: computedStyle.height,
                 offsetWidth: iframe.offsetWidth,
                 offsetHeight: iframe.offsetHeight,
                 
                 // Posición
                 top: rect.top,
                 left: rect.left,
                 bottom: rect.bottom,
                 right: rect.right,
                 
                 // Contenedor padre
                 parentDisplay: window.getComputedStyle(containerRef.current!).display,
                 parentVisibility: window.getComputedStyle(containerRef.current!).visibility,
                 parentOverflow: window.getComputedStyle(containerRef.current!).overflow,
                 
                 // Verificar si está en viewport
                 inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
                 
                 // Verificar si hay CSS que lo oculte
                 hiddenByCSS: computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || parseFloat(computedStyle.opacity) === 0,
                 
                 // Verificar si tiene dimensiones
                 hasDimensions: iframe.offsetWidth > 0 && iframe.offsetHeight > 0
               })
             }
             
             diagnoseProductionIssue()
           }
         }, 2000)
         
         return () => clearTimeout(checkWidget)
       }
     }, [widgetId])

    // Mostrar botón de emergencia si no hay iframe visible
    useEffect(() => {
      if (widgetId) {
        const checkIframe = setTimeout(() => {
          const iframe = containerRef.current?.querySelector('iframe')
          const isVisible = iframe && 
            iframe.style.display !== 'none' && 
            iframe.style.visibility !== 'hidden' &&
            iframe.offsetWidth > 0 &&
            iframe.offsetHeight > 0
          
          if (!isVisible) {
            console.warn('⚠️ Iframe no visible, mostrando botón de emergencia')
            setShowEmergencyButton(true)
          }
        }, 3000)
        
        return () => clearTimeout(checkIframe)
      }
    }, [widgetId])

    const forceVisibility = () => {
      const iframe = containerRef.current?.querySelector('iframe')
      if (iframe) {
        iframe.style.setProperty('display', 'block', 'important')
        iframe.style.setProperty('visibility', 'visible', 'important')
        iframe.style.setProperty('opacity', '1', 'important')
        iframe.style.setProperty('width', '100%', 'important')
        iframe.style.setProperty('height', '65px', 'important')
        iframe.style.setProperty('border', 'none', 'important')
        iframe.style.setProperty('margin', '0', 'important')
        iframe.style.setProperty('padding', '0', 'important')
        iframe.style.setProperty('z-index', '9999', 'important')
        
        console.log('🚨 VISIBILIDAD FORZADA MANUALMENTE')
        setShowEmergencyButton(false)
      }
    }

    // Monitor para arreglar problemas de visibilidad automáticamente
    useEffect(() => {
      if (widgetId && containerRef.current) {
        const fixVisibility = () => {
          const iframe = containerRef.current?.querySelector('iframe')
          if (iframe) {
            // Forzar visibilidad del iframe
            iframe.style.setProperty('display', 'block', 'important')
            iframe.style.setProperty('visibility', 'visible', 'important')
            iframe.style.setProperty('opacity', '1', 'important')
            iframe.style.setProperty('width', '100%', 'important')
            iframe.style.setProperty('height', '65px', 'important')
            iframe.style.setProperty('border', 'none', 'important')
            iframe.style.setProperty('margin', '0', 'important')
            iframe.style.setProperty('padding', '0', 'important')
            
            console.log('🔧 Iframe forzado a visible con !important')
          }
        }
        
        // Arreglar inmediatamente
        fixVisibility()
        
        // Arreglar después de un delay
        const timer1 = setTimeout(fixVisibility, 500)
        const timer2 = setTimeout(fixVisibility, 1000)
        const timer3 = setTimeout(fixVisibility, 2000)
        
        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
          clearTimeout(timer3)
        }
      }
    }, [widgetId])

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
    <div 
      ref={containerRef}
      className={`turnstile-container ${className}`}
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        minHeight: '65px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}
    >
      {showEmergencyButton && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
          <button
            onClick={forceVisibility}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            🚨 FORZAR VISIBILIDAD
          </button>
        </div>
      )}
    </div>
  )
  }
)

Turnstile.displayName = 'Turnstile'

export { Turnstile }
export type { TurnstileRef }


