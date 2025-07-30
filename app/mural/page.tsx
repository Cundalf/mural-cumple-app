"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Heart, Send, Trash2, Download, Loader2 } from "lucide-react"
import { useRealtime } from "@/hooks/use-realtime"
import { Turnstile, type TurnstileRef } from "@/components/ui/turnstile"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useToast } from "@/hooks/use-toast"
import { useTurnstile } from "@/hooks/use-turnstile"

interface Message {
  id: string
  text: string
  author: string
  timestamp: string
  color: string
}

const colors = [
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-red-100 border-red-300 text-red-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-lime-100 border-lime-300 text-lime-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-violet-100 border-violet-300 text-violet-800",
  "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-amber-100 border-amber-300 text-amber-800",
]

export default function MuralPage() {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''
  const [newMessage, setNewMessage] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"
  const { toast } = useToast()
  
  const isTurnstileDisabled = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true'
  
  const turnstile = useTurnstile({
    siteKey,
    disabled: isTurnstileDisabled,
    reuseTokenDuration: 5 * 60 * 1000, // 5 minutos para mensajes
    autoResetOnError: true,
    maxRetries: 3
  })

  const {
    items: messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error: loadError,
    refresh,
    setItems: setMessages
  } = useInfiniteScroll<Message>({
    apiEndpoint: '/api/messages',
    limit: 30,
    onError: (error) => {
      console.error('Error al cargar mensajes:', error)
      toast({
        title: "Error al cargar mensajes",
        description: "No se pudieron cargar algunos mensajes",
        variant: "destructive",
      })
    }
  })

  const handleMessageCreated = useCallback((message: Message) => {
    setMessages(prev => [message, ...prev]);
  }, [setMessages]);

  const handleMessageDeleted = useCallback((data: { id: string }) => {
    setMessages(prev => prev.filter(msg => msg.id !== data.id));
  }, [setMessages]);

  const handleConnected = useCallback(() => {
    refresh()
  }, [refresh]);

  const { disconnect, reconnect, isConnected } = useRealtime({
    onMessageCreated: handleMessageCreated,
    onMessageDeleted: handleMessageDeleted,
    onConnected: handleConnected
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !authorName.trim()) {
      return
    }

    if (isSubmitting) {
      return
    }
    
    // Obtener token válido (reutilizable si aún es válido)
    const token = isTurnstileDisabled ? null : turnstile.getToken()
    
    if (!isTurnstileDisabled && !token) {
        toast({
            title: "Verificación requerida",
            description: "Por favor, completa la verificación para continuar.",
            variant: "destructive",
        })
        return
    }

    setIsSubmitting(true)

    try {
      const color = colors[Math.floor(Math.random() * colors.length)]

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newMessage.trim(),
          author: authorName.trim(),
          color,
          turnstileToken: token,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        setAuthorName("")
        
        // No resetear inmediatamente para permitir reutilizar el token
        // El token se reutilizará automáticamente durante su período de validez
        
        toast({
            title: "¡Mensaje enviado!",
            description: "Gracias por dejar tu recuerdo en el mural.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al enviar mensaje')
      }
    } catch (error) {
        toast({
            title: "Error al enviar",
            description: "Hubo un problema al enviar tu mensaje. Intenta de nuevo.",
            variant: "destructive",
        })
      console.error('Error al enviar mensaje:', error)
    } finally {
      setTimeout(() => {
        setIsSubmitting(false)
      }, 100)
    }
  }

  const deleteMessage = async (id: string) => {
    try {
      const response = await fetch(`/api/messages?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // message deleted via realtime
      }
    } catch (error) {
      console.error('Error al eliminar mensaje:', error)
    }
  }

  const generatePDF = async () => {
    if (messages.length === 0) return

    setIsGeneratingPDF(true)

    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mural de Mensajes</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              background: linear-gradient(135deg, #fefce8 0%, #fdf2f8 50%, #eff6ff 100%) !important;
              padding: 40px 20px;
              min-height: 100vh;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .header h1 {
              font-size: 48px;
              color: #374151 !important;
              margin-bottom: 16px;
              font-weight: bold;
            }
            
            .header p {
              font-size: 20px;
              color: #6b7280 !important;
            }
            
            .messages-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 24px;
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .message-card {
              border-radius: 12px;
              padding: 24px;
              border: 2px solid;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              break-inside: avoid;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .message-text {
              font-size: 18px;
              line-height: 1.6;
              margin-bottom: 16px;
              font-weight: 500;
            }
            
            .message-author {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .message-date {
              font-size: 14px;
              opacity: 0.75;
            }
            
            .heart {
              position: absolute;
              top: 16px;
              right: 16px;
              width: 20px;
              height: 20px;
              opacity: 0.6;
            }
            
            /* Colores para las tarjetas */
            .bg-pink-100 { 
              background-color: #fce7f3 !important; 
              border-color: #f9a8d4 !important; 
              color: #be185d !important; 
            }
            .bg-blue-100 { 
              background-color: #dbeafe !important; 
              border-color: #93c5fd !important; 
              color: #1d4ed8 !important; 
            }
            .bg-yellow-100 { 
              background-color: #fef3c7 !important; 
              border-color: #fcd34d !important; 
              color: #d97706 !important; 
            }
            .bg-purple-100 { 
              background-color: #e9d5ff !important; 
              border-color: #c4b5fd !important; 
              color: #7c3aed !important; 
            }
            .bg-green-100 { 
              background-color: #d1fae5 !important; 
              border-color: #86efac !important; 
              color: #059669 !important; 
            }
            .bg-orange-100 { 
              background-color: #fed7aa !important; 
              border-color: #fdba74 !important; 
              color: #ea580c !important; 
            }
            .bg-red-100 { 
              background-color: #fee2e2 !important; 
              border-color: #fca5a5 !important; 
              color: #dc2626 !important; 
            }
            .bg-indigo-100 { 
              background-color: #e0e7ff !important; 
              border-color: #a5b4fc !important; 
              color: #4338ca !important; 
            }
            .bg-teal-100 { 
              background-color: #ccfbf1 !important; 
              border-color: #5eead4 !important; 
              color: #0f766e !important; 
            }
            .bg-cyan-100 { 
              background-color: #cffafe !important; 
              border-color: #67e8f9 !important; 
              color: #0891b2 !important; 
            }
            .bg-lime-100 { 
              background-color: #ecfccb !important; 
              border-color: #bef264 !important; 
              color: #65a30d !important; 
            }
            .bg-emerald-100 { 
              background-color: #d1fae5 !important; 
              border-color: #6ee7b7 !important; 
              color: #047857 !important; 
            }
            .bg-violet-100 { 
              background-color: #ede9fe !important; 
              border-color: #c4b5fd !important; 
              color: #6d28d9 !important; 
            }
            .bg-fuchsia-100 { 
              background-color: #fae8ff !important; 
              border-color: #f0abfc !important; 
              color: #c026d3 !important; 
            }
            .bg-rose-100 { 
              background-color: #ffe4e6 !important; 
              border-color: #fda4af !important; 
              color: #e11d48 !important; 
            }
            .bg-amber-100 { 
              background-color: #fef3c7 !important; 
              border-color: #fbbf24 !important; 
              color: #d97706 !important; 
            }
            
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body { 
                background: linear-gradient(135deg, #fefce8 0%, #fdf2f8 50%, #eff6ff 100%) !important;
              }
              .message-card { 
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💕 Mural de Mensajes 💕</h1>
            <p>Recuerdos especiales de nuestro día</p>
          </div>
          
          <div class="messages-grid">
            ${messages
              .map((message) => {
                const colorClass = message.color.split(" ")[0]
                return `
                  <div class="message-card ${colorClass}" style="position: relative;">
                    <div style="position: relative;">
                      <p class="message-text">"${message.text}"</p>
                      <p class="message-author">- ${message.author}</p>
                      <p class="message-date">${new Date(message.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="heart">💕</div>
                  </div>
                `
              })
              .join("")}
          </div>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    } catch (error) {
      console.error("Error generando PDF:", error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando mural...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 mx-2 sm:mx-0">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent text-xs sm:text-sm px-3 sm:px-4 min-w-[60px] sm:min-w-auto"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            
            <div className="flex-1 flex justify-center min-w-0 px-2">
              <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-800 text-center truncate">Mural de Mensajes</h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
              
              {messages.length > 0 && (
                <Button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  variant="outline"
                  size="sm"
                  className="border-2 border-pink-300 text-pink-700 hover:bg-pink-100 bg-transparent text-xs sm:text-sm px-2 sm:px-3 min-w-[40px] sm:min-w-auto"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{isGeneratingPDF ? "..." : "PDF"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card className="mb-8 border-2 border-yellow-200 bg-white/80 backdrop-blur-sm mx-2 sm:mx-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-center text-gray-800 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <span className="text-center">Escribe un mensaje especial</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="author" className="text-lg font-medium text-gray-700">
                  Tu nombre
                </Label>
                <Input
                  id="author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="mt-2 text-lg p-4 border-2 border-gray-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 focus:outline-none hover:border-yellow-300 transition-all duration-200 bg-white hover:bg-yellow-50/50 focus:bg-yellow-50/30"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-lg font-medium text-gray-700">
                  Tu mensaje
                </Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe algo bonito y especial..."
                  className="mt-2 text-lg p-4 border-2 border-gray-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 focus:outline-none hover:border-yellow-300 transition-all duration-200 min-h-[120px] resize-none bg-white hover:bg-yellow-50/50 focus:bg-yellow-50/30"
                  maxLength={200}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-2">{newMessage.length}/200 caracteres</p>
              </div>

              {!isTurnstileDisabled && (
                <div className="flex justify-center">
                  <Turnstile
                    ref={turnstile.turnstileRef}
                    siteKey={siteKey}
                    onVerify={turnstile.handleVerify}
                    onError={turnstile.handleError}
                    onExpire={turnstile.handleExpire}
                    theme="light"
                    size="normal"
                    autoResetOnError={true}
                    maxRetries={3}
                    className="mt-4"
                  />
                </div>
              )}
              
              {turnstile.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⚠️</span>
                    <span className="text-sm text-red-700">{turnstile.error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 text-lg rounded-full"
                disabled={!newMessage.trim() || !authorName.trim() || (!isTurnstileDisabled && !turnstile.isTokenValid) || isSubmitting}
              >
                <Send className="w-5 h-5 mr-2" />
                {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {messages.length === 0 && !isLoading ? (
          <Card className="border-2 border-gray-200 bg-white/60">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-6">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">El mural está vacío</h3>
              <p className="text-lg text-gray-500">¡Sé el primero en escribir un mensaje especial!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={`${message.color} border-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative`}
                >
                  <CardContent className="p-6 relative">
                    <Heart className="absolute top-4 right-4 w-5 h-5 text-current opacity-60" />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMessage(message.id)}
                        className="absolute top-2 right-10 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="pr-8">
                      <p className="text-lg leading-relaxed mb-4 font-medium">"{message.text}"</p>

                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-base">- {message.author}</p>
                      </div>

                      <p className="text-sm opacity-75 mt-2">{new Date(message.timestamp).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-yellow-200">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Cargando más mensajes...</span>
                </div>
              </div>
            )}

            {!hasMore && messages.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="px-6 py-3 bg-pink-50 border border-pink-200 rounded-full">
                  <span className="text-pink-700 font-medium">💕 ¡Has leído todos los mensajes! 💕</span>
                </div>
              </div>
            )}

            {loadError && (
              <div className="flex justify-center items-center py-8">
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-red-700 font-medium mb-2">Error al cargar más mensajes</p>
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
