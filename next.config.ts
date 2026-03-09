import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "https://gestao-de-treinos.onrender.com/api/auth/:path*",
      },
      {
        source: "/api/ai",
        destination: "https://gestao-de-treinos.onrender.com/ai",
      },
      {
        source: "/api/me",
        destination: "https://gestao-de-treinos.onrender.com/me",
      },
      {
        source: "/api/stats",
        destination: "https://gestao-de-treinos.onrender.com/stats",
      },
      {
        source: "/api/workout-plans/:path*",
        destination:
          "https://gestao-de-treinos.onrender.com/workout-plans/:path*",
      },
    ];
  },
};

export default nextConfig;