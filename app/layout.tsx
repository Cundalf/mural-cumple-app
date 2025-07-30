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
            onError={(e) => {
              console.error('Error cargando Turnstile script:', e)
            }}
          />
        )}
        {/* Error handler para scripts externos */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Estado global para Turnstile
            window.turnstileState = 'unloaded';
            
            // Función global para manejar la carga de Turnstile
            window.onTurnstileLoaded = function() {
              window.turnstileState = 'loaded';
              console.log('✅ Turnstile script cargado exitosamente');
              
              // Disparar evento personalizado para notificar a los componentes
              window.dispatchEvent(new CustomEvent('turnstileLoaded'));
            };
            
            // Función para manejar errores de Turnstile
            window.onTurnstileError = function() {
              window.turnstileState = 'error';
              console.error('❌ Error cargando Turnstile script');
              
              // Disparar evento personalizado para notificar a los componentes
              window.dispatchEvent(new CustomEvent('turnstileError'));
            };
            
            // Configurar el script con callbacks
            if (typeof window !== 'undefined') {
              const script = document.querySelector('script[src*="turnstile"]');
              if (script) {
                script.onload = window.onTurnstileLoaded;
                script.onerror = window.onTurnstileError;
              }
            }
            
            window.addEventListener('error', function(e) {
              // Silenciar errores de share-modal.js y otros scripts externos
              if (e.filename && (e.filename.includes('share-modal') || e.filename.includes('extension'))) {
                e.preventDefault();
                return true;
              }
            });
            
            // Manejar errores de extensiones o scripts inyectados
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.message && e.reason.message.includes('share-modal')) {
                e.preventDefault();
              }
            });
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
