import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://codeflow.dong02.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
