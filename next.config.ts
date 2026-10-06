import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Party link-preview images read their fonts from disk at request time.
  outputFileTracingIncludes: {
    "/events/**": ["./assets/og/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
