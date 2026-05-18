import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Allow HMR + static assets when accessing the dev server from a Tailscale
  // host (by name or 100.x IP) or the LAN. Production export ignores this.
  allowedDevOrigins: [
    "sunshine.tail8c7baf.ts.net",
    "100.85.152.25",
    "192.168.1.198",
  ],
};

export default nextConfig;
