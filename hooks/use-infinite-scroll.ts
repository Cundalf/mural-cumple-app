import { useState, useEffect, useCallback, useRef } from 'react'

export interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface ApiResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

interface UseInfiniteScrollOptions<T> {
  apiEndpoint: string
  limit: number
  onNewItems?: (items: T[]) => void
  onError?: (error: Error) => void
}

interface UseInfiniteScrollReturn<T> {
  items: T[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  refresh: () => void
  setItems: React.Dispatch<React.SetStateAction<T[]>>
}

export function useInfiniteScroll<T>({
  apiEndpoint,
  limit,
  onNewItems,
  onError
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const onNewItemsRef = useRef(onNewItems)
  const onErrorRef = useRef(onError)
  
  // Actualizar las referencias cuando cambien las funciones
  useEffect(() => {
    onNewItemsRef.current = onNewItems
  }, [onNewItems])
  
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const fetchPage = useCallback(async (page: number, reset = false) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setError(null)
      if (page === 1 && reset) {
        setIsLoading(true)
      } else if (page > 1) {
        setIsLoadingMore(true)
      }

      const url = `${apiEndpoint}?page=${page}&limit=${limit}`
      const response = await fetch(url, { 
        signal: controller.signal,
        cache: 'no-store' // Evitar cache para datos en tiempo real
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: ApiResponse<T> = await response.json()

      if (page === 1 && reset) {
        // Primera carga o refresh completo
        setItems(data.data)
      } else {
        // Cargar más elementos
        setItems(prev => [...prev, ...data.data])
      }

      setHasMore(data.pagination.hasNextPage)
      setCurrentPage(page)
      
      // Callback para elementos nuevos
      if (onNewItemsRef.current && data.data.length > 0) {
        onNewItemsRef.current(data.data)
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request cancelado, no hacer nada
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      
      if (onErrorRef.current) {
        onErrorRef.current(error instanceof Error ? error : new Error(errorMessage))
      }
      
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      abortControllerRef.current = null
    }
  }, [apiEndpoint, limit]) // Remover onNewItems y onError de dependencias

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !error) {
      fetchPage(currentPage + 1)
    }
  }, [currentPage, hasMore, isLoadingMore, error, fetchPage])

  const refresh = useCallback(() => {
    setCurrentPage(1)
    setHasMore(true)
    fetchPage(1, true)
  }, [fetchPage])

  // Carga inicial - solo ejecutar una vez al montar
  useEffect(() => {
    let mounted = true
    
    const initialLoad = () => {
      if (mounted) {
        fetchPage(1, true)
      }
    }
    
    initialLoad()
    
    // Cleanup function
    return () => {
      mounted = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // Sin dependencias - solo ejecutar al montar

  // Recargar cuando cambien apiEndpoint o limit
  useEffect(() => {
    if (items.length > 0) { // Solo si ya hay datos cargados
      setCurrentPage(1)
      setHasMore(true)
      fetchPage(1, true)
    }
  }, [apiEndpoint, limit])

  // Auto-scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore || error) return

      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Cargar más cuando esté cerca del final (300px antes)
      if (scrollTop + windowHeight >= documentHeight - 300) {
        loadMore()
      }
    }

    // Throttle scroll event
    let timeoutId: NodeJS.Timeout
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }

    window.addEventListener('scroll', throttledHandleScroll)
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      clearTimeout(timeoutId)
    }
  }, [loadMore, isLoadingMore, hasMore, error])

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    setItems
  }
} 