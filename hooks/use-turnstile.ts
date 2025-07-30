'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { TurnstileRef } from '@/components/ui/turnstile'
import { useToast } from '@/hooks/use-toast'

interface UseTurnstileOptions {
  siteKey: string
  disabled?: boolean
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
  reuseTokenDuration?: number
  autoResetOnError?: boolean
  maxRetries?: number
}

interface UseTurnstileReturn {
  turnstileRef: React.RefObject<TurnstileRef>
  token: string | null
  error: string | null
  isLoading: boolean
  isTokenValid: boolean
  reset: () => void
  execute: () => void
  getToken: () => string | null
  handleVerify: (token: string) => void
  handleError: (error: string) => void
  handleExpire: () => void
}

const TOKEN_REUSE_DEFAULT_DURATION = 5 * 60 * 1000 // 5 minutos por defecto

export function useTurnstile({
  siteKey,
  disabled = false,
  onSuccess,
  onError,
  reuseTokenDuration = TOKEN_REUSE_DEFAULT_DURATION,
  autoResetOnError = true,
  maxRetries = 3
}: UseTurnstileOptions): UseTurnstileReturn {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenTimestamp, setTokenTimestamp] = useState<number | null>(null)
  
  const turnstileRef = useRef<TurnstileRef>(null)
  const tokenExpiryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { toast } = useToast()

  const isTokenValid = token !== null && 
    tokenTimestamp !== null && 
    (Date.now() - tokenTimestamp) < reuseTokenDuration

  const clearTokenExpiry = useCallback(() => {
    if (tokenExpiryRef.current) {
      clearTimeout(tokenExpiryRef.current)
      tokenExpiryRef.current = undefined
    }
  }, [])

  const setTokenWithExpiry = useCallback((newToken: string) => {
    clearTokenExpiry()
    
    setToken(newToken)
    setTokenTimestamp(Date.now())
    setError(null)
    setIsLoading(false)
    
    // Programar expiración automática del token
    tokenExpiryRef.current = setTimeout(() => {
      setToken(null)
      setTokenTimestamp(null)
      // No reset automático aquí, dejar que sea manual
    }, reuseTokenDuration)
    
    onSuccess?.(newToken)
  }, [clearTokenExpiry, reuseTokenDuration, onSuccess])

  const handleVerify = useCallback((newToken: string) => {
    
    
    if (!newToken) {
      setError('Token vacío recibido')
      return
    }
    
    setTokenWithExpiry(newToken)
  }, [setTokenWithExpiry])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setToken(null)
    setTokenTimestamp(null)
    setIsLoading(false)
    clearTokenExpiry()
    
    onError?.(errorMessage)
    
    // Mostrar toast solo para errores importantes que el usuario debe saber
    if (errorMessage.includes('requerido') || 
        errorMessage.includes('fallida') || 
        errorMessage.includes('expirado')) {
      toast({
        title: "Error de verificación",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [clearTokenExpiry, onError, toast])

  const handleExpire = useCallback(() => {
    setToken(null)
    setTokenTimestamp(null)
    setError('La verificación ha expirado. Por favor, inténtalo de nuevo.')
    clearTokenExpiry()
    
    toast({
      title: "Verificación expirada",
      description: "La verificación ha expirado. Por favor, complétala nuevamente.",
      variant: "destructive",
    })
  }, [clearTokenExpiry, toast])

  const reset = useCallback(() => {
    console.log('🔄 Reset completo de Turnstile iniciado')
    
    // Limpiar estado del hook
    setToken(null)
    setTokenTimestamp(null)
    setError(null)
    setIsLoading(false)
    clearTokenExpiry()
    
    // Resetear el widget
    if (turnstileRef.current) {
      try {
        turnstileRef.current.reset()
        console.log('✅ Reset del hook completado')
        
      } catch (error) {
        console.warn('⚠️ Error al resetear widget desde hook:', error)
        setError('Error al reiniciar verificación. Usa el botón "Recargar" si persiste.')
      }
    } else {
      console.warn('⚠️ No hay referencia al widget para resetear')
      setError('Widget no disponible. Usa el botón "Recargar".')
    }
  }, [clearTokenExpiry])

  const execute = useCallback(() => {
    if (!turnstileRef.current) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      turnstileRef.current.execute()
    } catch (error) {
      console.error('Error al ejecutar Turnstile:', error)
      setIsLoading(false)
      handleError('Error al iniciar la verificación')
    }
  }, [handleError])

  const getToken = useCallback(() => {
    // Verificar si tenemos un token válido primero
    if (isTokenValid) {
      return token
    }
    
    // Si no, intentar obtener el token actual del widget
    if (turnstileRef.current) {
      try {
        const currentToken = turnstileRef.current.getResponse()
        if (currentToken && currentToken !== token) {
          setTokenWithExpiry(currentToken)
          return currentToken
        }
      } catch (error) {
        console.warn('Error al obtener token actual:', error)
      }
    }
    
    return null
  }, [isTokenValid, token, setTokenWithExpiry])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearTokenExpiry()
    }
  }, [clearTokenExpiry])

  // Auto-reset cuando el token expira naturalmente
  useEffect(() => {
    if (!isTokenValid && token === null && !error && !disabled) {
      // Token expirado, preparar para nueva verificación
      setIsLoading(false)
    }
  }, [isTokenValid, token, error, disabled])

  return {
    turnstileRef,
    token: isTokenValid ? token : null,
    error,
    isLoading,
    isTokenValid,
    reset,
    execute,
    getToken,
    handleVerify,
    handleError,
    handleExpire
  }
}