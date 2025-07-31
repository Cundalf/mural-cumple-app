"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Download, ArrowLeft, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function QRPage() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    // Obtener la URL base (sin /qr)
    const baseUrl = window.location.origin
    setCurrentUrl(baseUrl)

    // Generar el QR code con colores violeta/rosado
    QRCode.toDataURL(baseUrl, {
      width: 800, // QR más grande para impresión
      margin: 4,
      color: {
        dark: "#6d28d9", // Violeta oscuro
        light: "#fdf2f8" // Rosa claro
      }
    }).then((dataUrl) => {
      setQrCodeDataUrl(dataUrl)
      setIsGenerating(false)
    }).catch((err) => {
      console.error("Error generando QR:", err)
      setIsGenerating(false)
    })
  }, [])

    const downloadQR = async () => {
    if (!qrCodeDataUrl) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const qrCard = document.getElementById('qr-card')
      
      if (qrCard) {
        const canvas = await html2canvas(qrCard, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true
        })
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = 'qr-mural-cumple-card.png'
            link.href = url
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
        })
      }
    } catch (error) {
      console.error('Error:', error)
      // Fallback: descargar solo el QR
      const link = document.createElement('a')
      link.download = 'qr-mural-cumple.png'
      link.href = qrCodeDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generando código QR...</p>
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
              <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-800 text-center truncate">
                Código QR para Imprimir
              </h1>
            </div>
            
                         <div className="flex-shrink-0">
               <Button
                 onClick={downloadQR}
                 className="bg-pink-600 hover:bg-pink-700 text-white border-2 border-pink-500"
               >
                 <Download className="w-4 h-4 mr-2" />
                 <span className="hidden sm:inline">Descargar</span>
               </Button>
             </div>
          </div>
        </div>

                 {/* QR Code Container */}
         <div className="flex flex-col items-center justify-center min-h-[60vh]">
           <div id="qr-card" className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-pink-200 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Mural de Cumpleaños
              </h2>
              <p className="text-gray-600">
                Escanea este código QR para acceder al evento
              </p>
            </div>

            {qrCodeDataUrl && (
              <div className="relative bg-white p-6 rounded-xl shadow-lg">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code para imprimir"
                  className="w-full max-w-2xl h-auto mx-auto"
                />
                {/* Corazón en el centro del QR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-2">URL del evento:</p>
              <p className="text-xs text-gray-700 break-all font-mono bg-gray-100 p-3 rounded-lg">
                {currentUrl}
              </p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-8 text-center max-w-md mx-auto">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Instrucciones para imprimir:</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Haz clic en "Descargar" para guardar la imagen</li>
                <li>• Imprime en papel blanco de buena calidad</li>
                <li>• Asegúrate de que el QR sea completamente visible</li>
                <li>• El tamaño recomendado es A4 o carta</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 