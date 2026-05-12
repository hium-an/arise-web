import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  regions: ['sin1'],
  headers: [
    routes.headers('/(.*)', {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    }),
    routes.cacheControl('/_next/static/(.*)', {
      public: true,
      maxAge: '1 year',
      immutable: true,
    }),
  ],
};
