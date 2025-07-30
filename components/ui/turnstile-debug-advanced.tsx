'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'

interface TurnstileDebugAdvancedProps {
  siteKey: string
  className?: string
}

export function TurnstileDebugAdvanced({ siteKey, className = '' }: TurnstileDebugAdvancedProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const updateDebugInfo = () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      siteKey: siteKey ? `${siteKey.substring(0, 10)}...` : 'No configurada',
      disableTurnstile: process.env.NEXT_PUBLIC_DISABLE_TURNSTILE,
    }

    // Información del navegador
    if (typeof window !== 'undefined') {
      info.browser = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      }

      // Estado de Turnstile
      info.turnstile = {
        state: window.turnstileState || 'undefined',
        available: !!window.turnstile,
        functions: window.turnstile ? Object.keys(window.turnstile) : [],
      }

      // Verificar scripts
      const scripts = Array.from(document.querySelectorAll('script'))
      info.scripts = {
        total: scripts.length,
        turnstileScripts: scripts.filter(s => s.src?.includes('turnstile')).map(s => ({
          src: s.src,
          async: s.async,
          defer: s.defer,
          loaded: s.complete
        }))
      }

      // Verificar contenedores de Turnstile
      const turnstileContainers = document.querySelectorAll('.turnstile-container')
      info.containers = {
        total: turnstileContainers.length,
        containers: Array.from(turnstileContainers).map((container, index) => {
          const iframe = container.querySelector('iframe')
          const div = container.querySelector('div')
          return {
            index,
            hasIframe: !!iframe,
            iframeSrc: iframe?.src || 'no-src',
            iframeVisible: iframe ? 
              (iframe.style.display !== 'none' && iframe.style.visibility !== 'hidden' && iframe.style.opacity !== '0') : 
              false,
            divVisible: div ? 
              (div.style.display !== 'none' && div.style.visibility !== 'hidden' && div.style.opacity !== '0') : 
              false,
            childrenCount: container.children.length
          }
        })
      }

      // Verificar errores en consola
      info.consoleErrors = []
      const originalError = console.error
      console.error = (...args) => {
        info.consoleErrors.push({
          message: args.join(' '),
          timestamp: new Date().toISOString()
        })
        originalError.apply(console, args)
      }
    }

    setDebugInfo(info)
    setLastUpdate(new Date())
  }

  useEffect(() => {
    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 5000)
    return () => clearInterval(interval)
  }, [siteKey])

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Mostrar debugging avanzado"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🔍 Debug Avanzado</h3>
          <div className="flex gap-2">
            <button
              onClick={updateDebugInfo}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Actualizar información"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Ocultar"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Última actualización:</span>
            <span className="text-gray-800">{lastUpdate.toLocaleTimeString()}</span>
          </div>

          {/* Estado de Turnstile */}
          <div className="border-t pt-2">
            <h4 className="font-medium text-gray-700 mb-2">Estado de Turnstile</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Script cargado:</span>
                <span className={debugInfo.turnstile?.state === 'loaded' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.turnstile?.state || 'undefined'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>API disponible:</span>
                <span className={debugInfo.turnstile?.available ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.turnstile?.available ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Funciones:</span>
                <span className="text-gray-600">{debugInfo.turnstile?.functions?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Contenedores */}
          <div className="border-t pt-2">
            <h4 className="font-medium text-gray-700 mb-2">Contenedores ({debugInfo.containers?.total || 0})</h4>
            {debugInfo.containers?.containers?.map((container: any, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span>Contenedor {index + 1}:</span>
                  <span className={container.hasIframe ? 'text-green-600' : 'text-red-600'}>
                    {container.hasIframe ? 'Con iframe' : 'Sin iframe'}
                  </span>
                </div>
                <div className="text-gray-500 mt-1">
                  <div>Iframe visible: {container.iframeVisible ? 'Sí' : 'No'}</div>
                  <div>Div visible: {container.divVisible ? 'Sí' : 'No'}</div>
                  <div>Hijos: {container.childrenCount}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scripts */}
          <div className="border-t pt-2">
            <h4 className="font-medium text-gray-700 mb-2">Scripts ({debugInfo.scripts?.turnstileScripts?.length || 0})</h4>
            {debugInfo.scripts?.turnstileScripts?.map((script: any, index: number) => (
              <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                <div className="text-gray-600 truncate">{script.src}</div>
                <div className="text-gray-500 mt-1">
                  async: {script.async ? 'Sí' : 'No'} | 
                  defer: {script.defer ? 'Sí' : 'No'} | 
                  loaded: {script.loaded ? 'Sí' : 'No'}
                </div>
              </div>
            ))}
          </div>

          {/* Errores recientes */}
          {debugInfo.consoleErrors?.length > 0 && (
            <div className="border-t pt-2">
              <h4 className="font-medium text-gray-700 mb-2">Errores recientes</h4>
              <div className="space-y-1">
                {debugInfo.consoleErrors.slice(-3).map((error: any, index: number) => (
                  <div key={index} className="bg-red-50 p-2 rounded text-xs text-red-700">
                    {error.message.substring(0, 100)}...
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 