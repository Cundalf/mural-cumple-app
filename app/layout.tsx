import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Celebremos juntos',
  description: 'Created by Cundalf with v0, Next.js, Tailwind CSS and Cursor AI',
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
        {/* Cloudflare Turnstile */}
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        {/* Error handler para scripts externos */}
        <script dangerouslySetInnerHTML={{
          __html: `
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
