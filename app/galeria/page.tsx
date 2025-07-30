"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, ImageIcon, Video, X, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useRealtime } from "@/hooks/use-realtime"
import { Turnstile, useTurnstile } from "@/components/ui/turnstile"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  original_name: string
  timestamp: string
}

export default function GaleriaPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"
  const { toast } = useToast()
  
  // Turnstile hook para protección contra bots
  const { token: turnstileToken, error: turnstileError, handleVerify, handleError, handleExpire, reset, isDisabled: isTurnstileDisabled } = useTurnstile()

  // Hook de scroll infinito para cargar media
  const {
    items: mediaItems,
    isLoading,
    isLoadingMore,
    hasMore,
    error: loadError,
    refresh,
    setItems: setMediaItems
  } = useInfiniteScroll<MediaItem>({
    apiEndpoint: '/api/media',
    limit: 20,
    onError: (error) => {
      console.error('Error al cargar archivos multimedia:', error)
      toast({
        title: "Error al cargar galería",
        description: "No se pudieron cargar algunos archivos multimedia",
        variant: "destructive",
      })
    }
  })

  // Handlers estables para eventos en tiempo real
  const handleMediaUploaded = useCallback((media: MediaItem) => {
    setMediaItems(prev => {
      // Verificar si ya existe antes de agregar
      const exists = prev.some(item => item.id === media.id);
      if (exists) {
        return prev; // No agregar si ya existe
      }
      return [media, ...prev];
    });
  }, [setMediaItems]);

  const handleMediaDeleted = useCallback((data: { id: string }) => {
    setMediaItems(prev => prev.filter(item => item.id !== data.id));
    setSelectedMedia(prev => prev?.id === data.id ? null : prev);
  }, [setMediaItems]);

  const handleConnected = useCallback(() => {
    // Conexión establecida - refrescar datos
    refresh()
  }, [refresh]);

  // Configurar tiempo real con handlers estables
  const { disconnect, reconnect, isConnected } = useRealtime({
    onMediaUploaded: handleMediaUploaded,
    onMediaDeleted: handleMediaDeleted,
    onConnected: handleConnected
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Prevenir subida múltiple
    if (isUploading) {
      event.target.value = ""
      return
    }

    // Verificar que Turnstile haya sido completado (solo si no está deshabilitado)
    if (!isTurnstileDisabled && !turnstileToken) {
      event.target.value = ""
      return
    }

    // Validar tamaño y tipo de archivos
    const maxSize = 100 * 1024 * 1024 // 100MB (límite de Cloudflare)
    const allowedTypes = ['image/', 'video/']
    
    for (let file of Array.from(files)) {
      if (file.size > maxSize) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} supera el límite de 100MB`,
          variant: "destructive",
        })
        event.target.value = ""
        return
      }
      
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        toast({
          title: "Tipo de archivo no válido",
          description: `${file.name} no es una imagen o video válido`,
          variant: "destructive",
        })
        event.target.value = ""
        return
      }
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      
      // Agregar todos los archivos al FormData
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      // Agregar el token de Turnstile
      formData.append('turnstileToken', turnstileToken)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al subir archivos')
      }

      // Los archivos se agregarán automáticamente via eventos en tiempo real
      // Solo resetear Turnstile si no está deshabilitado
      if (!isTurnstileDisabled) {
        reset() // Resetear Turnstile para el siguiente envío
      }
      
      // Mostrar mensaje de éxito con toast
      toast({
        title: "¡Archivos subidos!",
        description: `${files.length} archivo(s) subido(s) exitosamente`,
      })
    } catch (error) {
      console.error('Error al subir archivos:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al subir archivos. Por favor, intenta de nuevo.'
      toast({
        title: "Error al subir archivos",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Asegurarse de que siempre se resetee el estado
      setTimeout(() => {
        setIsUploading(false)
      }, 100) // Pequeño delay para evitar problemas de UI
      event.target.value = ""
    }
  }

  const deleteMedia = async (id: string) => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/media?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // El archivo se eliminará automáticamente via eventos en tiempo real
      // Pero si por alguna razón el evento no llega, hacemos fallback local después de 2 segundos
      setTimeout(() => {
        setMediaItems(prev => {
          const stillExists = prev.some(item => item.id === id);
          if (stillExists) {
            // Si aún existe después de 2 segundos, lo eliminamos localmente
            return prev.filter(item => item.id !== id);
          }
          return prev;
        });
        
        // También cerrar modal si está abierto
        setSelectedMedia(prev => prev?.id === id ? null : prev);
      }, 2000);
      
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      // Mostrar error al usuario (opcional)
      alert('Error al eliminar el archivo. Por favor intenta de nuevo.');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando galería...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 mx-2 sm:mx-0">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent text-xs sm:text-sm px-3 sm:px-4 min-w-[60px] sm:min-w-auto"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            
            <div className="flex-1 flex justify-center min-w-0 px-2">
              <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-800 text-center truncate">Galería de Recuerdos</h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Indicador de conexión compacto */}
              <div className={`flex items-center gap-1 px-1 sm:px-2 py-1 rounded-full ${
                isConnected() 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-red-100 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected() ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-xs font-medium hidden sm:inline ${
                  isConnected() ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isConnected() ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-white/80 backdrop-blur-sm mx-2 sm:mx-0">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-blue-200 rounded-full mb-4">
                <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Comparte tus fotos y videos</h2>

              <div className="relative">
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading || (!isTurnstileDisabled && !turnstileToken)}
                />
                <div className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isTurnstileDisabled || turnstileToken 
                    ? 'border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-100/50' 
                    : 'border-gray-300 bg-gray-50/50'
                }`}>
                  <div className="flex flex-col items-center">
                    <Upload className={`w-12 h-12 mb-4 ${
                      isTurnstileDisabled || turnstileToken ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-xl font-semibold mb-2 ${
                      isTurnstileDisabled || turnstileToken ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {isUploading ? "Subiendo archivos..." : 
                       isTurnstileDisabled ? "Toca aquí para seleccionar" :
                       turnstileToken ? "Toca aquí para seleccionar" : "Completa la verificación primero"}
                    </p>
                    <p className={`text-lg ${
                      isTurnstileDisabled || turnstileToken ? 'text-blue-600' : 'text-gray-400'
                    }`}>Fotos y videos</p>
                  </div>
                </div>
              </div>
              
              {/* Turnstile para protección contra bots */}
              <div className="flex justify-center mt-6">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                  onVerify={handleVerify}
                  onError={handleError}
                  onExpire={handleExpire}
                  theme="light"
                  size="normal"
                />
              </div>
              
              {/* Mostrar error de Turnstile si existe */}
              {turnstileError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⚠️</span>
                    <span className="text-sm text-red-700">{turnstileError}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        {mediaItems.length === 0 && !isLoading ? (
          <Card className="border-2 border-gray-200 bg-white/60">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-6">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">Aún no hay recuerdos</h3>
              <p className="text-lg text-gray-500">¡Sé el primero en compartir una foto o video!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems.map((item) => (
                <Dialog key={item.id}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-pink-200 hover:border-pink-300 group overflow-hidden relative">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMedia(item.id)
                          }}
                          className="absolute top-2 right-2 z-20 text-white hover:text-red-600 hover:bg-white/90 bg-black/50 rounded-full p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <CardContent className="p-0 relative aspect-square">
                        {item.type === "image" ? (
                          <img
                            src={item.url || "/placeholder.svg"}
                            alt="Imagen compartida"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-gray-900">
                            <video src={item.url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white/80 text-xs">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent
                    className="max-w-5xl max-h-[95vh] p-0 bg-black/95 border-0"
                    aria-describedby="media-description"
                  >
                    <DialogTitle className="sr-only">
                      Ver {item.type === "image" ? "imagen" : "video"} en tamaño completo
                    </DialogTitle>
                    <DialogClose asChild>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 hover:bg-white/10 rounded-full p-3"
                        aria-label="Cerrar"
                      >
                        <X className="w-8 h-8" />
                      </Button>
                    </DialogClose>
                    <div className="flex items-center justify-center min-h-[80vh] p-4">
                      {item.type === "image" ? (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt="Imagen compartida"
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <video
                          src={item.url}
                          controls
                          className="max-w-full max-h-full object-contain rounded-lg"
                          autoPlay
                        />
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 text-white/80 bg-black/50 px-4 py-2 rounded-lg">
                      <p className="text-sm">Subido el {new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <div id="media-description" className="sr-only">
                      Modal para ver {item.type === "image" ? "imagen" : "video"} en tamaño completo
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>

            {/* Indicador de carga más elementos */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-blue-700 font-medium">Cargando más recuerdos...</span>
                </div>
              </div>
            )}

            {/* Mensaje de fin de contenido */}
            {!hasMore && mediaItems.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="px-6 py-3 bg-green-50 border border-green-200 rounded-full">
                  <span className="text-green-700 font-medium">✨ ¡Has visto todos los recuerdos! ✨</span>
                </div>
              </div>
            )}

            {/* Error de carga */}
            {loadError && (
              <div className="flex justify-center items-center py-8">
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-red-700 font-medium mb-2">Error al cargar más contenido</p>
                    <p className="text-red-600 text-sm mb-4">{loadError}</p>
                    <Button
                      onClick={refresh}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Intentar de nuevo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
