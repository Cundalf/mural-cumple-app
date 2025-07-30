/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para variables de entorno públicas
  env: {
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_DISABLE_TURNSTILE: process.env.NEXT_PUBLIC_DISABLE_TURNSTILE,
  },
  // Configuración para headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permitir que Cloudflare Turnstile funcione correctamente
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;",
          },
        ],
      },
    ]
  },
  // Configuración para optimización en producción
  // experimental: {
  //   optimizeCss: true, // Comentado para evitar error de build con 'critters'
  // },
  // Configuración para debugging en producción
  ...(process.env.NODE_ENV === 'production' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
}

export default nextConfig
