"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Heart, Send, Trash2, Download } from "lucide-react"

interface Message {
  id: string
  text: string
  author: string
  timestamp: Date
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
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get("admin") === "true"

  // Cargar mensajes del localStorage al iniciar
  useEffect(() => {
    const savedMessages = localStorage.getItem("baby-shower-messages")
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages)
      setMessages(
        parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      )
    }
  }, [])

  // Guardar en localStorage cuando cambien los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("baby-shower-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Simular actualizaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const savedMessages = localStorage.getItem("baby-shower-messages")
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages)
        const updatedMessages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))

        if (JSON.stringify(updatedMessages) !== JSON.stringify(messages)) {
          setMessages(updatedMessages)
        }
      }
    }, 2000) // Verificar cada 2 segundos

    return () => clearInterval(interval)
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !authorName.trim()) return

    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: newMessage.trim(),
      author: authorName.trim(),
      timestamp: new Date(),
      color: colors[Math.floor(Math.random() * colors.length)],
    }

    setMessages((prev) => [message, ...prev])
    setNewMessage("")
  }

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  const generatePDF = async () => {
    if (messages.length === 0) return

    setIsGeneratingPDF(true)

    try {
      // Crear una nueva ventana para el PDF
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      // Generar el HTML para el PDF
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
                      <p class="message-date">${message.timestamp.toLocaleString()}</p>
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

      // Esperar a que se cargue el contenido
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Mural de Mensajes</h1>
          </div>
          <div className="w-[120px] flex justify-end">
            {messages.length > 0 && (
              <Button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="bg-pink-500 hover:bg-pink-600 text-white border-2 border-pink-400"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {isGeneratingPDF ? "Generando..." : "PDF"}
              </Button>
            )}
          </div>
        </div>

        {/* Message Form */}
        <Card className="mb-8 border-2 border-yellow-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-800 flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              Escribe un mensaje especial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                />
                <p className="text-sm text-gray-500 mt-2">{newMessage.length}/200 caracteres</p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 text-lg rounded-full"
                disabled={!newMessage.trim() || !authorName.trim()}
              >
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensaje
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Messages Wall */}
        {messages.length === 0 ? (
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

                    <p className="text-sm opacity-75 mt-2">{message.timestamp.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
