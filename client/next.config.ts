import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://test.dong02.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
