import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Directory-style URLs let static hosts serve /route/ as route/index.html.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
