import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so we can deploy to Cloudflare Pages as plain assets.
  // Everything we ship is statically renderable: App Router server components
  // read MDX from disk at build time, GSAP runs client-side, no API routes,
  // no middleware, no ISR.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
