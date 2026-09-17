import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const host = dbUrl.replace(/^https?:\/\//, "").trim();
    const connectSrc = host ? `connect-src 'self' https://${host}` : "connect-src 'self'";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; ` +
              `script-src 'self' 'unsafe-inline'; ` +
              `style-src 'self' 'unsafe-inline'; ` +
              `img-src 'self' data: blob:; ` +
              `font-src 'self' data:; ` +
              `${connectSrc}; ` +
              `frame-ancestors 'none'; ` +
              `base-uri 'self'; ` +
              `form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;