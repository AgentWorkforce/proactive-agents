import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@cloud/core",
    "pg",
  ],
};

export default nextConfig;
