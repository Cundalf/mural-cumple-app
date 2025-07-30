"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, ImageIcon, Video, X, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useRealtime } from "@/hooks/use-realtime"
import { Turnstile, useTurnstile } from "@/components/ui/turnstile"

interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  original_name: string
  timestamp: string
}

export default function GaleriaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"
  
  // Turnstile hook para protección contra bots
  const { token: turnstileToken, error: turnstileError, handleVerify, handleError, handleExpire, reset, isDisabled: isTurnstileDisabled } = useTurnstile()

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
  }, []);

  const handleMediaDeleted = useCallback((data: { id: string }) => {
    setMediaItems(prev => prev.filter(item => item.id !== data.id));
    setSelectedMedia(prev => prev?.id === data.id ? null : prev);
  }, []);

  const handleConnected = useCallback(() => {
    // Conexión establecida
  }, []);

  // Configurar tiempo real con handlers estables
  const { disconnect, reconnect, isConnected } = useRealtime({
    onMediaUploaded: handleMediaUploaded,
    onMediaDeleted: handleMediaDeleted,
    onConnected: handleConnected
  });

  // Cargar archivos multimedia al iniciar
  useEffect(() => {
    const loadMedia = async () => {
      try {
        const response = await fetch('/api/media')
        if (response.ok) {
          const media = await response.json()
          setMediaItems(media)
        }
      } catch (error) {
        console.error('Error al cargar archivos multimedia:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMedia()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Verificar que Turnstile haya sido completado (solo si no está deshabilitado)
    if (!isTurnstileDisabled && !turnstileToken) {
      if (turnstileError) {
        alert(`Error de verificación: ${turnstileError}`)
      } else {
        alert('Por favor, completa la verificación de seguridad antes de subir archivos')
      }
      event.target.value = ""
      return
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
      reset() // Resetear Turnstile para el siguiente envío
    } catch (error) {
      console.error('Error al subir archivos:', error)
      alert('Error al subir archivos. Por favor, intenta de nuevo.')
    } finally {
      setIsUploading(false)
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
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Galería de Recuerdos</h1>
          </div>
          <div className="w-[120px] flex justify-end">
            {/* Indicador de conexión mejorado */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              isConnected() 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected() ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected() ? 'En línea' : 'Desconectado'}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Comparte tus fotos y videos</h2>

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
        {mediaItems.length === 0 ? (
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
        )}
      </div>
    </div>
  )
}
