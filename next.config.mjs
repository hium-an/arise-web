/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const cspProduction =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://apis.google.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://securetoken.googleapis.com; " +
  "frame-src https://accounts.google.com https://*.firebaseapp.com; " +
  "img-src 'self' data: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com;"

// Dev mode: thêm unsafe-eval cho React Fast Refresh + webpack HMR
const cspDevelopment =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "connect-src 'self' ws://localhost:* http://localhost:* https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://securetoken.googleapis.com; " +
  "frame-src https://accounts.google.com https://*.firebaseapp.com; " +
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com;"

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS chỉ có nghĩa trên HTTPS — bỏ qua trong dev
          ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
          // CSP chỉ apply trong production — dev mode có quá nhiều conflicts với eval-source-map
          ...(!isDev ? [{ key: 'Content-Security-Policy', value: cspProduction }] : []),
        ],
      },
    ]
  },
}

export default nextConfig
