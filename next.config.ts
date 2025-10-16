import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.app https://*.googleapis.com https://*.gstatic.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.firebaseapp.com https://*.googleusercontent.com https://*.firebasestorage.app",
              "connect-src 'self' data: blob: https://*.firebaseapp.com https://*.googleapis.com https://*.firestore.googleapis.com https://vercel.live wss://*.vercel.app https://smnjootmzkihsobrwarn.supabase.co https://cdn.jsdelivr.net",
              "frame-src 'self' blob: https://vercel.live",
              "worker-src 'self' blob: data: https://cdn.jsdelivr.net",
              "child-src 'self' blob: data: https://cdn.jsdelivr.net"
            ].join('; ')
          }
        ]
      }
    ];
  },
};

export default nextConfig;
