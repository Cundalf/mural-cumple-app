"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Share2, Heart, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function QRDialog() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Obtener la URL actual
    const url = window.location.href
    setCurrentUrl(url)

    // Generar el QR code con colores violeta/rosado
    QRCode.toDataURL(url, {
      width: 380,
      margin: 2,
      color: {
        dark: "#6d28d9", // Violeta oscuro
        light: "#fdf2f8" // Rosa claro
      }
    }).then((dataUrl) => {
      setQrCodeDataUrl(dataUrl)
    }).catch((err) => {
      console.error("Error generando QR:", err)
    })
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset después de 2 segundos
    } catch (err) {
      console.error('Error al copiar:', err)
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-pink-200 hover:border-pink-300"
        >
          <Share2 className="w-6 h-6 text-pink-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-800">
            Compartir Evento
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Escanea este código QR para acceder al evento
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {qrCodeDataUrl && (
            <div className="bg-white p-4 rounded-lg shadow-md relative">
              <img
                src={qrCodeDataUrl}
                alt="QR Code para compartir"
                className="w-96 h-96 mx-auto"
              />
              {/* Corazón en el centro del QR */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg width="80" height="80" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M30 52
                      C22 46 8 36 8 24
                      C8 14 18 8 30 18
                      C42 8 52 14 52 24
                      C52 36 38 46 30 52 Z"
                    fill="#ec4899"
                    stroke="#f9a8d4"
                    strokeWidth="4"
                  />
                </svg>
              </div>
            </div>
          )}
          <div className="text-center w-full">
            <p className="text-sm text-gray-500 mb-2">O copia este enlace:</p>
            <div 
              className="bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200 flex items-center justify-between group"
              onClick={copyToClipboard}
            >
              <p className="text-xs text-gray-700 break-all font-mono flex-1 mr-2">
                {currentUrl}
              </p>
              <div className="flex-shrink-0">
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </div>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1 animate-pulse">
                ¡Enlace copiado al portapapeles!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 