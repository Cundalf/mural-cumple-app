"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, ImageIcon, Video, X, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"

interface MediaItem {
  id: string
  type: "image" | "video"
  url: string
  name: string
  timestamp: Date
}

export default function GaleriaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"

  // Cargar items del localStorage al iniciar
  useEffect(() => {
    const savedItems = localStorage.getItem("baby-shower-media")
    if (savedItems) {
      const parsed = JSON.parse(savedItems)
      setMediaItems(
        parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })),
      )
    }
  }, [])

  // Guardar en localStorage cuando cambie mediaItems
  useEffect(() => {
    if (mediaItems.length > 0) {
      localStorage.setItem("baby-shower-media", JSON.stringify(mediaItems))
    }
  }, [mediaItems])

  // Simular actualizaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const savedItems = localStorage.getItem("baby-shower-media")
      if (savedItems) {
        const parsed = JSON.parse(savedItems)
        const updatedItems = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))

        if (JSON.stringify(updatedItems) !== JSON.stringify(mediaItems)) {
          setMediaItems(updatedItems)
        }
      }
    }, 2000) // Verificar cada 2 segundos

    return () => clearInterval(interval)
  }, [mediaItems])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    // Procesar cada archivo
    const newItems: MediaItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Crear URL del objeto
      const url = URL.createObjectURL(file)
      const type = file.type.startsWith("image/") ? "image" : "video"

      const newItem: MediaItem = {
        id: Date.now().toString() + i.toString() + Math.random().toString(36).substr(2, 9),
        type,
        url,
        name: file.name,
        timestamp: new Date(),
      }

      newItems.push(newItem)
    }

    // Agregar todos los items de una vez
    setMediaItems((prev) => [...newItems, ...prev])

    setIsUploading(false)
    event.target.value = ""
  }

  const deleteMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedMedia(null)
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
          <div className="w-[120px]"></div>
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
                  disabled={isUploading}
                />
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 hover:border-blue-400 transition-colors bg-blue-50/50 hover:bg-blue-100/50">
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-blue-500 mb-4" />
                    <p className="text-xl font-semibold text-blue-700 mb-2">
                      {isUploading ? "Subiendo archivos..." : "Toca aquí para seleccionar"}
                    </p>
                    <p className="text-lg text-blue-600">Fotos y videos</p>
                  </div>
                </div>
              </div>
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
                        <p className="text-white/80 text-xs">{item.timestamp.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent
                  className="max-w-5xl max-h-[95vh] p-0 bg-black/95 border-0"
                  aria-describedby="media-description"
                >
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
                    <p className="text-sm">Subido el {item.timestamp.toLocaleString()}</p>
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
