import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large CSV uploads (default ~1MB is too small for big CSVs)
  serverExternalPackages: ["mongoose"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
