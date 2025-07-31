/** @type {import('next').NextConfig} */
const nextConfig = {

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value:
            "default-src 'self';" +
            " script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cloudflare.com https://www.google.com https://www.gstatic.com;" +
            " style-src 'self' 'unsafe-inline' https://www.gstatic.com;" +
            " img-src 'self' data: https:;" +
            " connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.google.com;" +
            " frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.google.com;" +
            " child-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://www.google.com;" +
            " object-src 'none';" +
            " base-uri 'self';",
          },
        ],
      },
    ];
  },

  ...(process.env.NODE_ENV === 'production' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
};

export default nextConfig;