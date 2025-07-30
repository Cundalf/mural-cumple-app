import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Heart } from "lucide-react"
import { QRDialog } from "@/components/ui/qr-dialog"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-200 rounded-full mb-6">
            <Heart className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">¡Celebremos Juntos!</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Comparte tus fotos, videos y mensajes especiales en este día tan importante
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/galeria">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl md:text-3xl text-gray-800 mb-2">Galería de Recuerdos</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Sube y comparte fotos y videos del evento
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-full border-2 border-blue-400"
                >
                  Ver Galería
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mural">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-yellow-200 hover:border-yellow-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-200 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl md:text-3xl text-gray-800 mb-2">Mural de Mensajes</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Escribe mensajes bonitos y crea recuerdos especiales
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 text-lg rounded-full"
                >
                  Escribir Mensaje
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-lg">Hecho con 💕 para celebrar momentos especiales</p>
        </div>
      </div>
      
      {/* QR Dialog Component */}
      <QRDialog />
    </div>
  )
}
