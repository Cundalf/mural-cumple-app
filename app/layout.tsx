import type { Metadata } from "next"
import { GeistSans, GeistMono } from "geist/font"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { RecaptchaProvider } from "@/components/recaptcha-provider"
import { RecaptchaFallback } from "@/components/recaptcha-fallback"

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
      </head>
      <body>
        <RecaptchaProvider>
          <RecaptchaFallback>
            {children}
            <Toaster />
          </RecaptchaFallback>
        </RecaptchaProvider>
      </body>
    </html>
  )
}
