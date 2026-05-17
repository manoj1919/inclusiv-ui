import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Allow HMR + static assets when accessing the dev server from a Tailscale
  // hostname or the LAN. Production export ignores this.
  allowedDevOrigins: ["sunshine.tail8c7baf.ts.net", "192.168.1.198"],
};

export default nextConfig;
