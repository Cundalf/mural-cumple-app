"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Share2 } from "lucide-react"
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

  useEffect(() => {
    // Obtener la URL actual
    const url = window.location.href
    setCurrentUrl(url)

    // Generar el QR code
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    }).then((dataUrl) => {
      setQrCodeDataUrl(dataUrl)
    }).catch((err) => {
      console.error("Error generando QR:", err)
    })
  }, [])

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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img
                src={qrCodeDataUrl}
                alt="QR Code para compartir"
                className="w-64 h-64 mx-auto"
              />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">O copia este enlace:</p>
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-xs text-gray-700 break-all font-mono">
                {currentUrl}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 