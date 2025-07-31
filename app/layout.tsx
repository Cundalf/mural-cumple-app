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
            onLoad={() => {
              if (typeof window !== 'undefined') {
                window.turnstileState = 'loaded';
                console.log('✅ Turnstile script cargado exitosamente');
                window.dispatchEvent(new CustomEvent('turnstileLoaded'));
              }
            }}
            onError={() => {
              if (typeof window !== 'undefined') {
                window.turnstileState = 'error';
                console.error('❌ Error cargando Turnstile script');
                window.dispatchEvent(new CustomEvent('turnstileError'));
              }
            }}
          />
        )}
        {/* Estado inicial de Turnstile */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.turnstileState = 'unloaded';
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
