import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this folder as the root (avoid picking the parent lockfile)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
