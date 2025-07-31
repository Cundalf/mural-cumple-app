import type { Metadata } from "next"
import { GeistSans, GeistMono } from "geist/font"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Mural de Cumpleaños",
  description: "Comparte tus mensajes y fotos especiales",
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        {/* Cloudflare Turnstile - Cargar solo si está habilitado */}
        {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== 'true' && (
          <script 
            src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
            async 
            defer
          />
        )}
        {/* Script para manejar la carga de Turnstile */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Estado inicial de Turnstile
            if (typeof window !== 'undefined') {
              window.turnstileState = 'unloaded';
              
              // Función para manejar la carga exitosa
              window.onTurnstileLoaded = function() {
                window.turnstileState = 'loaded';
                console.log('✅ Turnstile script cargado exitosamente');
                window.dispatchEvent(new CustomEvent('turnstileLoaded'));
              };
              
              // Función para manejar errores
              window.onTurnstileError = function() {
                window.turnstileState = 'error';
                console.error('❌ Error cargando Turnstile script');
                window.dispatchEvent(new CustomEvent('turnstileError'));
              };
              
              // Configurar callbacks cuando el DOM esté listo
              document.addEventListener('DOMContentLoaded', function() {
                const script = document.querySelector('script[src*="turnstile"]');
                if (script) {
                  script.onload = window.onTurnstileLoaded;
                  script.onerror = window.onTurnstileError;
                }
              });
            }
          `
        }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
