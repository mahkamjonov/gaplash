import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The default bottom-left position covers the mobile tab bar.
  devIndicators: { position: "top-right" },
  async redirects() {
    return [{ source: "/", destination: "/home", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
