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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.app https://*.googleapis.com https://*.gstatic.com https://cdn.jsdelivr.net https://cdn.paddle.com https://www.highperformanceformat.com https://*.highperformanceformat.com https://pl28077859.effectivegatecpm.com https://*.effectivegatecpm.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.firebaseapp.com https://*.googleusercontent.com https://*.firebasestorage.app https://*.paddle.com https://*.effectivegatecpm.com https://*.highperformanceformat.com https://kettledroopingcontinuation.com https://professionaltrafficmonitor.com https://cdn.storageimagedisplay.com https://sneezedeplorebackache.com https://skinstackpeculiarity.com",
              "connect-src 'self' data: blob: https://*.firebaseapp.com https://*.googleapis.com https://*.firestore.googleapis.com https://vercel.live wss://*.vercel.app https://smnjootmzkihsobrwarn.supabase.co https://cdn.jsdelivr.net https://openrouter.ai https://api.groq.com https://*.paddle.com https://sandbox-api.paddle.com https://*.effectivegatecpm.com https://*.highperformanceformat.com https://kettledroopingcontinuation.com https://professionaltrafficmonitor.com https://wayfarerorthodox.com https://realizationnewestfangs.com https://sourshaped.com https://skinnycrawlinglax.com https://sneezedeplorebackache.com",
              "frame-src 'self' blob: https://vercel.live https://*.paddle.com https://sandbox-checkout.paddle.com https://*.effectivegatecpm.com https://*.highperformanceformat.com https://kettledroopingcontinuation.com https://wayfarerorthodox.com https://realizationnewestfangs.com https://sourshaped.com https://skinnycrawlinglax.com",
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
