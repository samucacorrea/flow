import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.API_PROXY_TARGET || "http://localhost:8000").replace(/\/$/, "");

    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/install", destination: `${backend}/install` },
      { source: "/install/:path*", destination: `${backend}/install/:path*` },
    ];
  },
};

export default nextConfig;
